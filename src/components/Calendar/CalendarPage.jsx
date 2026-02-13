import React, { useState } from 'react';

import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineCalendar } from 'react-icons/hi';

import Badge from '../common/Badge';
import Button from '../common/Button';

const events = [
  { id: 1, date: new Date(2025, 11, 10), title: 'Math Exam', type: 'exam', class: '10-A' },
  { id: 2, date: new Date(2025, 11, 12), title: 'Science Project Due', type: 'assignment', class: '9-B' },
  { id: 3, date: new Date(2025, 11, 15), title: 'Parent-Teacher Meeting', type: 'meeting', class: 'All' },
  { id: 4, date: new Date(2025, 11, 18), title: 'Sports Day', type: 'event', class: 'All' },
  { id: 5, date: new Date(2025, 11, 20), title: 'Winter Break', type: 'holiday', class: 'All' },
];

const eventColors = {
  exam: 'bg-red-100 text-red-700 border-red-200',
  assignment: 'bg-blue-100 text-blue-700 border-blue-200',
  meeting: 'bg-purple-100 text-purple-700 border-purple-200',
  event: 'bg-green-100 text-green-700 border-green-200',
  holiday: 'bg-orange-100 text-orange-700 border-orange-200',
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const dayEvents = events.filter(event => 
    isSameDay(event.date, selectedDate)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
        <p className="text-sm text-gray-500 mt-1">Schedule and events management</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-card p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <HiOutlineCalendar className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-800">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <HiOutlineChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <HiOutlineChevronRight className="w-4 h-4 text-gray-600" />
              </button>
              <Button variant="secondary" size="sm" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
            </div>
          </div>

          {/* Week days header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="p-4 bg-gray-50 rounded-lg" />
            ))}
            
            {monthDays.map((day) => {
              const dayEvents = events.filter(event => isSameDay(event.date, day));
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentDate);

              return (
                <button
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    p-4 rounded-lg border transition-all relative
                    ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                    ${isSelected 
                      ? 'border-primary-500 ring-2 ring-primary-200' 
                      : 'border-transparent hover:border-gray-200'
                    }
                  `}
                >
                  <span className={`
                    text-sm font-medium
                    ${isSelected ? 'text-primary-700' : isCurrentMonth ? 'text-gray-700' : 'text-gray-400'}
                  `}>
                    {format(day, 'd')}
                  </span>
                  
                  {dayEvents.length > 0 && (
                    <div className="absolute bottom-1 right-1 flex gap-0.5">
                      {dayEvents.slice(0, 3).map((event) => (
                        <span
                          key={event.id}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: eventColors[event.type].split(' ')[0].replace('bg-', '') }}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] text-gray-500">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Events list */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">
              Events for {format(selectedDate, 'MMMM d, yyyy')}
            </h3>
            <Button variant="primary" size="sm">+ Add</Button>
          </div>

          {dayEvents.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-sm text-gray-500">No events scheduled</p>
              <p className="text-xs text-gray-400 mt-1">Click + to add an event</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-4 rounded-lg border hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant={eventColors[event.type]}>
                      {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {format(event.date, 'h:mm a')}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-gray-800 mb-1">{event.title}</h4>
                  <p className="text-xs text-gray-400">Class: {event.class}</p>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming events preview */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Upcoming</h4>
            <div className="space-y-2">
              {events.slice(0, 3).map((event) => (
                <div key={event.id} className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary-700">
                      {format(event.date, 'dd')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-700 truncate">{event.title}</p>
                    <p className="text-xs text-gray-400">{format(event.date, 'MMM d')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}