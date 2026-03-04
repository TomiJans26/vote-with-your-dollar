import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getIndustries, getCompaniesByIndustry } from '../lib/api';
import { ChevronLeft, Building2, ChevronRight } from 'lucide-react';

const INDUSTRY_ICONS = {
  'food-beverage': '🍔',
  'personal-care': '🧴',
  'beauty-cosmetics': '💄',
  'household-cleaning': '🧹',
  'health-wellness': '💊',
  'baby-kids': '👶',
  'pet-care': '🐾',
  'clothing-apparel': '👕',
  'electronics-tech': '📱',
  'home-furniture': '🏠',
  'automotive': '🚗',
  'entertainment-media': '🎬',
  'financial-services': '🏦',
  'telecom-internet': '📡',
  'retail-ecommerce': '🛒',
  'restaurants-food-service': '🍽️',
  'tobacco-alcohol': '🚬',
  'consumer-conglomerate': '🏢',
};

export default function Explore() {
  const navigate = useNavigate();
  const [industries, setIndustries] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companiesLoading, setCompaniesLoading] = useState(false);

  useEffect(() => {
    getIndustries().then(data => {
      setIndustries(data);
      setLoading(false);
    });
  }, []);

  const selectIndustry = async (industry) => {
    setSelectedIndustry(industry);
    setCompaniesLoading(true);
    const data = await getCompaniesByIndustry(industry.slug);
    setCompanies(data);
    setCompaniesLoading(false);
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="text-center pt-4 space-y-3 animate-pulse">
          <div className="h-8 bg-white/10 rounded-full w-1/2 mx-auto" />
          <div className="h-3 bg-white/5 rounded-full w-2/3 mx-auto" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="glass-card rounded-3xl p-4 space-y-2 border border-dark-border">
              <div className="w-12 h-12 bg-white/10 rounded-2xl" />
              <div className="h-3 bg-white/10 rounded-full w-3/4" />
              <div className="h-2 bg-white/5 rounded-full w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-safe animate-slideUp">
      <div className="text-center pt-4 pb-2">
        <h2 className="text-3xl font-black tracking-tight">
          <span className="text-gradient">Explore</span> Companies
        </h2>
        <p className="text-sm text-dark-text-secondary mt-2">
          Browse 200+ companies across every industry
        </p>
      </div>

      {/* Industry grid */}
      {!selectedIndustry ? (
        <div className="grid grid-cols-2 gap-3">
          {industries.map(ind => (
            <button
              key={ind.slug}
              onClick={() => selectIndustry(ind)}
              className="group text-left glass-card rounded-3xl p-5 border border-dark-border hover:border-aligned/50 hover:bg-white/10 active:scale-95 transition-all"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                {INDUSTRY_ICONS[ind.slug] || '📦'}
              </div>
              <p className="text-sm font-bold text-dark-text mb-1 leading-tight">
                {ind.name}
              </p>
              {ind.company_count && (
                <p className="text-[10px] text-dark-text-muted font-medium">
                  {ind.company_count} companies
                </p>
              )}
            </button>
          ))}
        </div>
      ) : (
        /* Company list for selected industry */
        <div className="space-y-4">
          <button
            onClick={() => { setSelectedIndustry(null); setCompanies([]); }}
            className="flex items-center gap-2 text-sm text-aligned hover:text-aligned/80 transition-colors font-semibold group"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            All Industries
          </button>

          <div className="glass-card rounded-3xl p-5 border border-dark-border">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-aligned/10 flex items-center justify-center text-3xl shrink-0">
                {INDUSTRY_ICONS[selectedIndustry.slug] || '📦'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-lg text-dark-text mb-1">{selectedIndustry.name}</h3>
                <p className="text-xs text-dark-text-secondary leading-relaxed">
                  {selectedIndustry.description}
                </p>
              </div>
            </div>
          </div>

          {companiesLoading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="glass-card rounded-3xl p-4 space-y-2 border border-dark-border animate-pulse">
                  <div className="h-4 bg-white/10 rounded-full w-1/2" />
                  <div className="h-2 bg-white/5 rounded-full w-1/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {companies.map(company => (
                <button
                  key={company.slug}
                  onClick={() => navigate(`/result/search-${company.slug}`)}
                  className="group w-full text-left glass-card rounded-2xl p-4 hover:bg-white/10 active:scale-[0.98] transition-all border border-dark-border hover:border-aligned/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-aligned/10 flex items-center justify-center shrink-0 group-hover:bg-aligned/20 transition-colors">
                      <Building2 size={20} className="text-aligned" />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-dark-text truncate">
                        {company.name}
                      </p>
                      <p className="text-[10px] text-dark-text-muted font-medium">
                        {company.brand_count} brand{company.brand_count !== 1 ? 's' : ''}
                        {company.ticker && ` • ${company.ticker}`}
                        {company.country && company.country !== 'US' && ` • ${company.country}`}
                      </p>
                      {company.top_brands && (
                        <p className="text-[10px] text-dark-text-muted/60 truncate mt-0.5">
                          {company.top_brands.join(', ')}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {company.alignment != null && (
                        <span className={`text-xs font-black px-3 py-1.5 rounded-full ${
                          company.alignment >= 70 ? 'bg-aligned text-white' :
                          company.alignment >= 40 ? 'bg-warning text-white' :
                          'bg-danger text-white'
                        }`}>
                          {company.alignment}%
                        </span>
                      )}
                      <ChevronRight 
                        size={18} 
                        className="text-dark-text-muted group-hover:text-aligned group-hover:translate-x-1 transition-all" 
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
