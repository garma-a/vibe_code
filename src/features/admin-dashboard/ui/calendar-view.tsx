"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
const hours = ["08:00 AM", "10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM"];

export function CalendarView() {
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly');

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#0C2340]">Calendar Grid</h2>
          <p className="text-muted-foreground mt-1">Visually track all rooms and schedules.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-slate-100 p-1 rounded-lg flex text-sm">
            <button 
              className={`px-4 py-1.5 rounded-md font-medium transition ${view === 'weekly' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setView('weekly')}
            >
              Weekly
            </button>
            <button 
              className={`px-4 py-1.5 rounded-md font-medium transition ${view === 'monthly' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setView('monthly')}
            >
              Monthly
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" className="font-medium gap-2">
              <CalendarIcon className="h-4 w-4" /> Today
            </Button>
            <Button variant="outline" size="icon"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col border-slate-200">
        <CardContent className="p-0 flex-1 overflow-auto bg-slate-50/50">
          <div className="min-w-[800px] h-full flex flex-col">
            {/* Grid Header */}
            <div className="grid grid-cols-6 border-b border-slate-200 bg-white sticky top-0 z-10">
              <div className="p-4 border-r border-slate-200 font-semibold text-slate-400 text-sm text-center">Time</div>
              {days.map(day => (
                <div key={day} className="p-4 border-r border-slate-200 text-center font-bold text-[#0C2340]">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Grid Body */}
            <div className="flex-1 overflow-y-auto">
              {hours.map((hour, i) => (
                <div key={hour} className="grid grid-cols-6 border-b border-slate-100 relative group min-h-[120px]">
                  <div className="p-4 border-r border-slate-200 text-sm font-medium text-slate-500 text-center bg-white">
                    {hour}
                  </div>
                  
                  {/* Slots */}
                  {days.map((day, j) => {
                    // Injecting some dummy data
                    const isFixed = i === 1 && j === 1; // Mon 10am
                    const isMulti = i === 3 && j === 2; // Tue 2pm
                    const isExceptional = i === 2 && j === 3; // Wed 12pm

                    return (
                      <div key={day} className="p-2 border-r border-slate-200 hover:bg-slate-50 transition cursor-pointer relative">
                        {isFixed && (
                          <div className="absolute inset-2 bg-blue-100/80 border border-blue-200 rounded-md p-2 flex flex-col shadow-sm">
                            <span className="text-xs font-bold text-blue-800">Fixed Lecture</span>
                            <span className="text-xs text-blue-600 truncate mt-1">Room A • CS101</span>
                          </div>
                        )}
                        {isMulti && (
                          <div className="absolute inset-2 bg-emerald-100/80 border border-emerald-200 rounded-md p-2 flex flex-col shadow-sm">
                            <span className="text-xs font-bold text-emerald-800">Multi-Purpose</span>
                            <span className="text-xs text-emerald-600 truncate mt-1">Hall 3 • Seminar</span>
                          </div>
                        )}
                        {isExceptional && (
                          <div className="absolute inset-2 bg-amber-100/80 border border-amber-200 rounded-md p-2 flex flex-col shadow-sm">
                            <span className="text-xs font-bold text-amber-800">Exceptional</span>
                            <span className="text-xs text-amber-600 truncate mt-1">Room B • Makeup</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Legend */}
      <div className="flex items-center gap-6 shrink-0 pt-2 pb-4">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-400"></div><span className="text-sm text-slate-600">Fixed Lecture</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-400"></div><span className="text-sm text-slate-600">Multi-Purpose</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-400"></div><span className="text-sm text-slate-600">Exceptional</span></div>
      </div>
    </div>
  );
}
