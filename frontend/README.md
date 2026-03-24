🚌 School Bus Live Tracking SystemA robust, Real-time Fleet Management solution built using React, Node.js, MySQL, and Socket.io.
This system allows Administrators to manage routes and enables Parents to track the live location of school buses with high precision.

🚀 Key Features🛠️ Admin DashboardUser Management: Secure registration for Drivers and Parents.Fleet Management: Add new buses and assign them to specific drivers.
Route Optimization: Define specific Stops (Lat/Lng) for every bus route.
Live Monitoring: Real-time visibility into which buses are "On Trip" or "Parked".
🚌 Driver Logic (Simulation)Live GPS Synchronization:
 Driver location updates to the server every 5 seconds.
 Smart Geofencing: Automatic current_stop updates when the bus enters a 100-meter radius of a designated stop.
 👪 Parent DashboardReal-time Tracking:
  Visual movement of the bus on an interactive map.
  ETA & Progress: View the next upcoming stop and estimated time of arrival.Attendance Tracking: (Roadmap) Status updates for when a child boards or exits the bus.
  🏗️ Tech StackFrontend: React.js (Vite), Lucide React (Icons), Axios, Leaflet (Maps).Backend: Node.js, Express.js.
  Database: MySQL (Implemented with Connection Pooling for performance).Real-time Engine: Socket.io (Low-latency bi-directional communication).
  ⚙️ Setup & Installation1. Database SetupExecute the following schema in your MySQL environment:
  
SQL-- Buses Table

CREATE TABLE buses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  busNumber VARCHAR(50) UNIQUE,
  driver_id INT,
  route VARCHAR(255),
  status ENUM('Parked', 'On Trip') DEFAULT 'Parked',
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  current_stop VARCHAR(255)
);

-- Bus Stops Table
CREATE TABLE bus_stops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bus_id INT,
  stop_name VARCHAR(255),
  stop_lat DECIMAL(10, 8),
  stop_lng DECIMAL(11, 8),
  stop_order INT,
  FOREIGN KEY (bus_id) REFERENCES buses(id)
);
2. Backend ConfigurationBashcd backend
npm install
# Create a .env file and add your DB credentials
npm start
3. Frontend ConfigurationBashcd frontend
npm install
npm run dev
📝 API DocumentationMethodEndpointDescriptionPOST/api/auth/loginUser Authentication & JWT GenerationGET/api/busesFetch real-time status of all busesPOST/api/stops/add-stopAdmin: Add a new stop to a routePOST/api/buses/update-locationDriver: Sync current GPS coordinates