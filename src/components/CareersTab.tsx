import React, { useState, useMemo } from 'react';
import { UserProfile, JobListing, CareerExhibition } from '../types';
import { JOB_LISTINGS, CAREER_EXHIBITIONS, CATALOG_STATS } from '../data/mockData';
import { Search, MapPin, Briefcase, Calendar, Clock, ExternalLink, Filter, GraduationCap, Award, Building2, Users } from 'lucide-react';
import { SearchBar } from './SearchBar';

interface CareersTabProps {
  user: UserProfile;
}

export const CareersTab: React.FC<CareersTabProps> = ({ user }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedField, setSelectedCategory] = useState('all');
  const [activeView, setActiveView] = useState<'jobs' | 'exhibitions'>('jobs');

  const fields = useMemo(() => {
    const allFields = new Set<string>();
    JOB_LISTINGS.forEach(j => allFields.add(j.field));
    CAREER_EXHIBITIONS.forEach(e => allFields.add(e.field));
    return ['all', ...Array.from(allFields)];
  }, []);

  const filteredJobs = useMemo(() => {
    return JOB_LISTINGS.filter(job => {
      const matchesField = selectedField === 'all' || job.field === selectedField;
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesField && matchesSearch;
    });
  }, [searchQuery, selectedField]);

  const filteredExhibitions = useMemo(() => {
    return CAREER_EXHIBITIONS.filter(ex => {
      const matchesField = selectedField === 'all' || ex.field === selectedField;
      const matchesSearch = ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ex.organizer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ex.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesField && matchesSearch;
    });
  }, [searchQuery, selectedField]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Careers Header */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-8">
        <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-2 font-mono">
          <span>TTG Career Ecosystem</span>
          <span aria-hidden="true">·</span>
          <span>Hiring Partners & Career Exhibitions</span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-600 dark:text-emerald-400">{CATALOG_STATS.jobOpenings} Active Openings</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Careers & Talent Exhibition
            </h1>
            <p className="mt-2 text-stone-600 dark:text-stone-400 max-w-2xl text-sm sm:text-base">
              Bridge the gap between elite institutional study and professional placement. Explore accredited job listings and exclusive student exhibitions.
            </p>
          </div>

          <div className="flex items-center gap-2 p-1 bg-stone-100 dark:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-800 text-xs">
            <button
              onClick={() => setActiveView('jobs')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${activeView === 'jobs' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm' : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'}`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Job Listings</span>
            </button>
            <button
              onClick={() => setActiveView('exhibitions')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${activeView === 'exhibitions' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm' : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'}`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Career Events</span>
            </button>
          </div>
        </div>

        <div className="mt-8">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedField}
            onCategoryChange={setSelectedCategory}
            categories={fields.map(f => ({ id: f, label: f === 'all' ? 'All Fields' : f }))}
            placeholder={activeView === 'jobs' ? "Search by role, company, or keywords..." : "Search exhibitions, organizers, or topics..."}
            stats={{
              customLabel: activeView === 'jobs' ? `${filteredJobs.length} Positions Found` : `${filteredExhibitions.length} Events Scheduled`
            }}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Listings Section (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          {activeView === 'jobs' ? (
            filteredJobs.length > 0 ? (
              filteredJobs.map(job => (
                <div key={job.id} className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl hover:border-stone-400 dark:hover:border-stone-700 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {job.company}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {job.location}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded text-[10px] font-mono font-bold uppercase">
                      {job.type}
                    </span>
                  </div>
                  
                  <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2 mb-4">
                    {job.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {job.requirements.slice(0, 3).map((req: string, i: number) => (
                      <span key={i} className="text-[10px] px-2 py-1 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 rounded-lg">
                        {req}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-stone-800">
                    <span className="text-sm font-bold text-stone-900 dark:text-stone-100 font-mono">
                      {job.salary_range}
                    </span>
                    <button className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-xs font-semibold hover:bg-stone-800 dark:hover:bg-white transition-all shadow-sm">
                      Apply Now
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center border border-dashed border-stone-300 dark:border-stone-700 rounded-3xl bg-stone-50 dark:bg-stone-900/50">
                <Briefcase className="w-8 h-8 text-stone-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">No matching roles found</h3>
                <p className="text-sm text-stone-500 mt-1">Try broadening your search or field filters.</p>
              </div>
            )
          ) : (
            filteredExhibitions.length > 0 ? (
              filteredExhibitions.map(ex => (
                <div key={ex.id} className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl group">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 shrink-0 bg-emerald-50 dark:bg-emerald-950 rounded-xl border border-emerald-100 dark:border-emerald-900 flex flex-col items-center justify-center text-emerald-700 dark:text-emerald-400">
                      <span className="text-xs font-bold uppercase">{ex.date.split('-')[1]}</span>
                      <span className="text-xl font-black">{ex.date.split('-')[2]}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">{ex.title}</h3>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded uppercase font-mono">
                          {ex.field}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{ex.organizer} · {ex.location}</p>
                      <p className="text-sm text-stone-600 dark:text-stone-300 mt-3">{ex.description}</p>
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
                        <div className="flex items-center gap-1.5 text-xs text-stone-500">
                          <Calendar className="w-3.5 h-3.5" />
                          {ex.date}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-stone-500">
                          <Clock className="w-3.5 h-3.5" />
                          {ex.time}
                        </div>
                        <button className="ml-auto text-xs font-bold text-stone-900 dark:text-stone-100 hover:underline">
                          Register Entry
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center border border-dashed border-stone-300 dark:border-stone-700 rounded-3xl bg-stone-50 dark:bg-stone-900/50">
                <Users className="w-8 h-8 text-stone-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">No events found</h3>
                <p className="text-sm text-stone-500 mt-1">Stay tuned for upcoming career symposiums.</p>
              </div>
            )
          )}
        </div>

        {/* Career Resources (1/3) */}
        <div className="space-y-6">
          <div className="p-6 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-2xl shadow-xl">
            <h4 className="text-sm font-black uppercase tracking-tighter mb-4 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Student Placement Track
            </h4>
            <div className="space-y-4">
              <div className="p-3 bg-white/10 dark:bg-stone-800/5 rounded-xl">
                <span className="text-[10px] font-bold opacity-60 uppercase block mb-1">Step 01</span>
                <p className="text-xs font-semibold leading-relaxed">Complete accredited professional level modules to unlock verified badges.</p>
              </div>
              <div className="p-3 bg-white/10 dark:bg-stone-800/5 rounded-xl opacity-60">
                <span className="text-[10px] font-bold opacity-60 uppercase block mb-1">Step 02</span>
                <p className="text-xs font-semibold leading-relaxed">Participate in virtual student exhibitions to showcase your study portfolio.</p>
              </div>
              <div className="p-3 bg-white/10 dark:bg-stone-800/5 rounded-xl opacity-60">
                <span className="text-[10px] font-bold opacity-60 uppercase block mb-1">Step 03</span>
                <p className="text-xs font-semibold leading-relaxed">Direct placement matching via TTG Institutional Hiring Partners.</p>
              </div>
            </div>
            <button className="w-full mt-6 py-2.5 bg-white dark:bg-stone-900 text-stone-900 dark:text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity">
              Join Placement Queue
            </button>
          </div>

          <div className="p-6 bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 rounded-2xl">
            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-4">Hiring Domains</h4>
            <div className="space-y-3">
              {fields.filter(f => f !== 'all').map(field => (
                <div key={field} className="flex items-center justify-between group cursor-pointer">
                  <span className="text-xs text-stone-600 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors">{field}</span>
                  <span className="text-[10px] font-mono text-stone-400">
                    {JOB_LISTINGS.filter(j => j.field === field).length} open
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
