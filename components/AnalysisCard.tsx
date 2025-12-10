import React from 'react';
import { PaperAnalysis } from '../types';

interface AnalysisCardProps {
  analysis: PaperAnalysis;
}

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; color: string }> = ({ title, icon, children, color }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden transition-all hover:shadow-md`}>
    <div className={`px-6 py-4 border-b border-slate-100 flex items-center space-x-3 ${color}`}>
      <div className="p-2 bg-white/20 rounded-lg text-white">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white tracking-wide">{title}</h3>
    </div>
    <div className="p-6 text-slate-700 leading-relaxed">
      {children}
    </div>
  </div>
);

const List: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="space-y-3">
    {items.map((item, index) => (
      <li key={index} className="flex items-start space-x-3">
        <span className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-blue-400"></span>
        <span className="text-slate-600">{item}</span>
      </li>
    ))}
  </ul>
);

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ analysis }) => {
  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Summary Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center space-x-3 mb-4">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
           <h2 className="text-2xl font-bold">Executive Summary</h2>
        </div>
        <p className="text-indigo-50 text-lg leading-relaxed opacity-95">
          {analysis.summary}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Problem Solved */}
        <Section
          title="Problem Solved"
          color="bg-amber-500"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        >
          <p>{analysis.problemSolved}</p>
        </Section>

        {/* Innovations */}
        <Section
          title="Main Innovations"
          color="bg-emerald-500"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        >
          <List items={analysis.innovations} />
        </Section>

        {/* Comparison Methods */}
        <Section
          title="Comparisons"
          color="bg-blue-500"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        >
           <List items={analysis.comparisonMethods} />
        </Section>

        {/* Limitations */}
        <Section
          title="Limitations & Defects"
          color="bg-rose-500"
          icon={
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
          }
        >
           <List items={analysis.limitations} />
        </Section>
      </div>
    </div>
  );
};
