// components/Attendance/DriverAttendance.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, Users, RefreshCw } from 'lucide-react';
import './DriverAttendance.css';

const DriverAttendance = ({ busId }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState({});
    const today = new Date().toLocaleDateString('en-IN', { 
        day: 'numeric', month: 'long', year: 'numeric' 
    });

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(
                `http://localhost:5000/api/attendance/today/${busId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setStudents(res.data.students);
        } catch (err) {
            console.error('Attendance fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (busId) fetchAttendance();
    }, [busId]);

    const handleMark = async (studentName, parentId, isPresent) => {
        setSaving(prev => ({ ...prev, [studentName]: true }));
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:5000/api/attendance/mark',
                { busId, studentName, isPresent, parentId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Local state update karo
            setStudents(prev => prev.map(s =>
                s.student_name === studentName
                    ? { ...s, is_present: isPresent }
                    : s
            ));
        } catch (err) {
            alert('Attendance mark nahi ho paya!');
        } finally {
            setSaving(prev => ({ ...prev, [studentName]: false }));
        }
    };

    const presentCount = students.filter(s => s.is_present).length;

    return (
        <div className="attendance-container">
            {/* Header */}
            <div className="attendance-header">
                <div>
                    <h3 className="attendance-title">
                        <Users size={20} /> Aaj ki Attendance
                    </h3>
                    <p className="attendance-date">{today}</p>
                </div>
                <button className="refresh-btn" onClick={fetchAttendance}>
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Stats */}
            <div className="attendance-stats">
                <div className="stat-pill stat-present">
                    ✅ Present: {presentCount}
                </div>
                <div className="stat-pill stat-absent">
                    ❌ Absent: {students.length - presentCount}
                </div>
                <div className="stat-pill stat-total">
                    👥 Total: {students.length}
                </div>
            </div>

            {/* Student List */}
            {loading ? (
                <p className="att-loading">Loading students...</p>
            ) : students.length === 0 ? (
                <p className="att-empty">Koi student registered nahi hai is bus pe.</p>
            ) : (
                <div className="student-list">
                    {students.map((student) => (
                        <div 
                            key={student.student_id}
                            className={`student-row ${student.is_present ? 'row-present' : 'row-absent'}`}
                        >
                            <div className="student-info">
                                <div className="student-avatar">
                                    {student.student_name.charAt(0).toUpperCase()}
                                </div>
                                <span className="student-name">{student.student_name}</span>
                            </div>

                            <div className="mark-btns">
                                <button
                                    className={`mark-btn present-btn ${student.is_present ? 'active-present' : ''}`}
                                    onClick={() => handleMark(student.student_name, student.parent_id, true)}
                                    disabled={saving[student.student_name]}
                                >
                                    <CheckCircle size={16} /> Present
                                </button>
                                <button
                                    className={`mark-btn absent-btn ${!student.is_present && student.marked_at ? 'active-absent' : ''}`}
                                    onClick={() => handleMark(student.student_name, student.parent_id, false)}
                                    disabled={saving[student.student_name]}
                                >
                                    <XCircle size={16} /> Absent
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DriverAttendance;
