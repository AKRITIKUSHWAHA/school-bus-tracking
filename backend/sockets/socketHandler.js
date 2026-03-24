// socketHandler.js — Real-time GPS Engine with Auto Route Simulation

const socketHandler = (io, pool) => {

  const busLocations = {};      // RAM: current location
  const busTrips = {};          // RAM: active trip data (stops, intervals)

  // ── Haversine Distance (meters) ──────────────────────────────────
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 +
              Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
              Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  // ── Interpolate: 2 points ke beech intermediate position ─────────
  const interpolate = (lat1, lng1, lat2, lng2, fraction) => ({
    lat: lat1 + (lat2 - lat1) * fraction,
    lng: lng1 + (lng2 - lng1) * fraction,
  });

  // ── Route Simulation Start ────────────────────────────────────────
  const startRouteSimulation = async (busId, busDbId, driverLat, driverLng) => {
    try {
      // Stops fetch karo
      const [stops] = await pool.execute(
        'SELECT * FROM bus_stops WHERE bus_id = ? ORDER BY stop_order ASC',
        [busDbId]
      );

      if (stops.length === 0) {
        console.log(`⚠️ Bus ${busId}: No stops found, using GPS only`);
        return;
      }

      console.log(`🗺️ Bus ${busId}: Route simulation started with ${stops.length} stops`);

      // Trip data initialize
      busTrips[busId] = {
        stops,
        currentStopIndex: 0,
        nextStopIndex: 1,
        simFraction: 0,       // 0 to 1 between current and next stop
        busDbId,
        active: true,
      };

      // Pehla stop current_stop set karo
      const firstStop = stops[0];
      await pool.execute(
        "UPDATE buses SET current_stop = ?, lat = ?, lng = ? WHERE busNumber = ?",
        [firstStop.stop_name, firstStop.stop_lat, firstStop.stop_lng, busId]
      );

      // Clients ko batao
      io.emit('stopUpdate', {
        busId,
        currentStop: firstStop.stop_name,
        currentStopIndex: 0,
        nextStop: stops[1]?.stop_name || null,
        totalStops: stops.length,
        allStops: stops.map(s => s.stop_name),
      });

      // ── Simulation Interval: Har 4 seconds ──────────────────────
      const interval = setInterval(async () => {
        const trip = busTrips[busId];
        if (!trip || !trip.active) {
          clearInterval(interval);
          return;
        }

        const { stops, currentStopIndex, nextStopIndex } = trip;

        // Last stop pe pahunch gaye — trip khatam
        if (nextStopIndex >= stops.length) {
          console.log(`🏁 Bus ${busId}: Reached last stop`);
          clearInterval(interval);
          return;
        }

        const currStop = stops[currentStopIndex];
        const nextStop = stops[nextStopIndex];

        // Fraction badhao — speed simulate (0.08 = ~30kmh approximate)
        trip.simFraction += 0.08;

        let newLat, newLng;

        if (trip.simFraction >= 1) {
          // Next stop pe pahunch gaye!
          newLat = parseFloat(nextStop.stop_lat);
          newLng = parseFloat(nextStop.stop_lng);

          trip.currentStopIndex = nextStopIndex;
          trip.nextStopIndex = nextStopIndex + 1;
          trip.simFraction = 0;

          const upcomingStop = stops[trip.nextStopIndex];

          console.log(`📍 Bus ${busId}: Reached ${nextStop.stop_name}`);

          // DB update
          await pool.execute(
            "UPDATE buses SET current_stop = ?, lat = ?, lng = ? WHERE busNumber = ?",
            [nextStop.stop_name, newLat, newLng, busId]
          );

          // Stop change broadcast
          io.emit('stopUpdate', {
            busId,
            currentStop: nextStop.stop_name,
            currentStopIndex: trip.currentStopIndex,
            nextStop: upcomingStop?.stop_name || null,
            totalStops: stops.length,
            allStops: stops.map(s => s.stop_name),
            arrivedAt: nextStop.stop_name,
          });

        } else {
          // Beech mein hai — interpolated position
          const pos = interpolate(
            parseFloat(currStop.stop_lat), parseFloat(currStop.stop_lng),
            parseFloat(nextStop.stop_lat), parseFloat(nextStop.stop_lng),
            trip.simFraction
          );
          newLat = pos.lat;
          newLng = pos.lng;

          // DB update
          await pool.execute(
            "UPDATE buses SET lat = ?, lng = ? WHERE busNumber = ?",
            [newLat, newLng, busId]
          );
        }

        // Location RAM update + broadcast
        busLocations[busId] = { lat: newLat, lng: newLng, updatedAt: new Date() };
        io.emit('locationUpdate', { busId, lat: newLat, lng: newLng });

      }, 4000);

      // Interval reference save karo taaki stop kar sakein
      busTrips[busId].interval = interval;

    } catch (err) {
      console.error('Route simulation error:', err.message);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`✅ Connected: ${socket.id}`);

    // ─── DRIVER: Live GPS location (real phone GPS) ───────────────
    socket.on('updateLocation', async (data) => {
      const { busId, lat, lng } = data;
      if (!busId || !lat || !lng) return;

      busLocations[busId] = { lat, lng, updatedAt: new Date() };
      io.emit('locationUpdate', { busId, lat, lng });

      try {
        await pool.execute(
          'UPDATE buses SET lat = ?, lng = ? WHERE busNumber = ?',
          [lat, lng, busId]
        );

        // Check: koi stop 100m ke andar hai?
        const trip = busTrips[busId];
        if (trip && trip.stops) {
          const { stops, currentStopIndex } = trip;
          // Agle stop se distance check karo
          if (trip.nextStopIndex < stops.length) {
            const nextStop = stops[trip.nextStopIndex];
            const dist = getDistance(lat, lng,
              parseFloat(nextStop.stop_lat),
              parseFloat(nextStop.stop_lng)
            );

            if (dist < 100) {
              // 100m ke andar — stop change karo
              trip.currentStopIndex = trip.nextStopIndex;
              trip.nextStopIndex += 1;
              trip.simFraction = 1; // Skip simulation

              const upcomingStop = stops[trip.nextStopIndex];

              await pool.execute(
                "UPDATE buses SET current_stop = ? WHERE busNumber = ?",
                [nextStop.stop_name, busId]
              );

              io.emit('stopUpdate', {
                busId,
                currentStop: nextStop.stop_name,
                currentStopIndex: trip.currentStopIndex,
                nextStop: upcomingStop?.stop_name || null,
                totalStops: stops.length,
                allStops: stops.map(s => s.stop_name),
                arrivedAt: nextStop.stop_name,
              });

              console.log(`📍 GPS: Bus ${busId} reached ${nextStop.stop_name}`);
            }
          }
        }
      } catch (err) {
        console.error('DB location update error:', err.message);
      }
    });

    // ─── DRIVER: Trip start ────────────────────────────────────────
    socket.on('tripStarted', async (data) => {
      const { busId, busDbId, lat, lng } = data;

      io.emit('busStatusUpdate', { busId, status: 'On Trip' });

      try {
        await pool.execute(
          "UPDATE buses SET status = 'On Trip' WHERE busNumber = ?",
          [busId]
        );
      } catch (err) {
        console.error('Trip start DB error:', err.message);
      }

      // Route simulation shuru karo
      if (busDbId) {
        await startRouteSimulation(busId, busDbId, lat, lng);
      }

      console.log(`🚌 Trip started: ${busId}`);
    });

    // ─── DRIVER: Trip stop ─────────────────────────────────────────
    socket.on('tripStopped', async (data) => {
      const { busId } = data;

      // Simulation band karo
      if (busTrips[busId]) {
        busTrips[busId].active = false;
        clearInterval(busTrips[busId].interval);
        delete busTrips[busId];
      }

      delete busLocations[busId];
      io.emit('busStatusUpdate', { busId, status: 'Parked' });

      try {
        await pool.execute(
          "UPDATE buses SET status = 'Parked', current_stop = 'Depot' WHERE busNumber = ?",
          [busId]
        );
      } catch (err) {
        console.error('Trip stop DB error:', err.message);
      }

      // Parent ko batao trip khatam
      io.emit('stopUpdate', {
        busId,
        currentStop: 'Depot',
        nextStop: null,
        totalStops: 0,
        allStops: [],
      });

      console.log(`🛑 Trip stopped: ${busId}`);
    });

    // ─── PARENT: Join hone pe last known state lo ─────────────────
    socket.on('getLastLocation', async (data) => {
      const { busId } = data;

      // RAM se location
      if (busLocations[busId]) {
        socket.emit('locationUpdate', { busId, ...busLocations[busId] });
      }

      // Current trip ka stop info
      const trip = busTrips[busId];
      if (trip && trip.stops) {
        const curr = trip.stops[trip.currentStopIndex];
        const next = trip.stops[trip.nextStopIndex];
        socket.emit('stopUpdate', {
          busId,
          currentStop: curr?.stop_name || 'Starting',
          currentStopIndex: trip.currentStopIndex,
          nextStop: next?.stop_name || null,
          totalStops: trip.stops.length,
          allStops: trip.stops.map(s => s.stop_name),
        });
      } else {
        // DB se current stop lo
        try {
          const [rows] = await pool.execute(
            'SELECT current_stop, status FROM buses WHERE busNumber = ?',
            [busId]
          );
          if (rows.length > 0) {
            socket.emit('stopUpdate', {
              busId,
              currentStop: rows[0].current_stop || 'Depot',
              nextStop: null,
              totalStops: 0,
              allStops: [],
            });
          }
        } catch (err) {
          console.error('getLastLocation DB error:', err.message);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;