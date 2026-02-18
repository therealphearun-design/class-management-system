import React, { memo, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { useAttendanceContext } from '../../context/AttendanceContext';
import Avatar from '../common/Avatar';

const EnhancedStudentCard = memo(function EnhancedStudentCard({ student, index }) {
  const { markAttendance, getStudentStatus } = useAttendanceContext();
  const [isHovered, setIsHovered] = useState(false);
  const status = getStudentStatus(student.id);

  const handleMark = (newStatus) => {
    markAttendance(student.id, newStatus);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="bg-white rounded-xl p-5 shadow-card hover:shadow-xl transition-all duration-300 border border-transparent hover:border-primary-200 relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 to-primary-100/0 group-hover:from-primary-50/30 group-hover:to-primary-100/30 transition-all duration-500" />

      <div className="relative">
        <div className="flex flex-col items-center text-center mb-4">
          <div className="relative mb-3">
            <Avatar src={student.avatar} name={student.name} size="lg" />

            <AnimatePresence>
              {status && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white
                    ${status === 'present' ? 'bg-attendance-present' : ''}
                    ${status === 'absent' ? 'bg-attendance-absent' : ''}
                    ${status === 'late' ? 'bg-attendance-late' : ''}
                  `}
                >
                  {status === 'present' ? 'P' : status === 'absent' ? 'A' : 'L'}
                </motion.div>
              )}
            </AnimatePresence>

            {isHovered && !status && (
              <motion.div
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-primary-400"
              />
            )}
          </div>

          <h3 className="text-sm font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
            {student.name}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Roll #{student.rollNo} | {student.class} | {student.shift || 'Morning'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          {['present', 'absent', 'late'].map((type) => (
            <motion.button
              key={type}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleMark(type)}
              className={`attendance-btn ${
                status === type ? type : 'inactive'
              }`}
            >
              {type === 'present' ? 'P' : type === 'absent' ? 'A' : 'L'}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
});

export default EnhancedStudentCard;
