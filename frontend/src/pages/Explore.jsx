import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getIndustries, getCompaniesByIndustry } from '../lib/api';

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
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-200 border-t-teal-600" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-center pt-2">
        <h2 className="text-xl font-bold text-teal-800">🔍 Explore Companies</h2>
        <p className="text-xs text-gray-400">Browse 200+ companies across every industry</p>
      </div>

      {/* Industry grid */}
      {!selectedIndustry ? (
        <div className="grid grid-cols-2 gap-2">
          {industries.map(ind => (
            <button
              key={ind.slug}
              onClick={() => selectIndustry(ind)}
              className="text-left p-3 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-teal-300 hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-1">{INDUSTRY_ICONS[ind.slug] || '📦'}</div>
              <p className="text-sm font-semibold text-gray-800">{ind.name}</p>
              {ind.company_count && (
                <p className="text-[10px] text-gray-400">{ind.company_count} companies</p>
              )}
            </button>
          ))}
        </div>
      ) : (
        /* Company list for selected industry */
        <div className="space-y-3">
          <button
            onClick={() => { setSelectedIndustry(null); setCompanies([]); }}
            className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            ← All Industries
          </button>

          <div className="flex items-center gap-3 bg-white rounded-xl shadow-sm p-3">
            <span className="text-3xl">{INDUSTRY_ICONS[selectedIndustry.slug] || '📦'}</span>
            <div>
              <h3 className="font-bold text-teal-800">{selectedIndustry.name}</h3>
              <p className="text-xs text-gray-400">{selectedIndustry.description}</p>
            </div>
          </div>

          {companiesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-teal-200 border-t-teal-600 mx-auto" />
            </div>
          ) : (
            <div className="space-y-2">
              {companies.map(company => (
                <button
                  key={company.slug}
                  onClick={() => navigate(`/result/search-${company.slug}`)}
                  className="w-full text-left bg-white rounded-xl shadow-sm p-3 hover:shadow-md transition-all border border-gray-100 hover:border-teal-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{company.name}</p>
                      <p className="text-[10px] text-gray-400">
                        {company.brand_count} brand{company.brand_count !== 1 ? 's' : ''}
                        {company.ticker && ` • ${company.ticker}`}
                        {company.country && company.country !== 'US' && ` • ${company.country}`}
                      </p>
                      {company.top_brands && (
                        <p className="text-[10px] text-gray-300 truncate mt-0.5">
                          {company.top_brands.join(', ')}
                        </p>
                      )}
                    </div>
                    {company.alignment != null && (
                      <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ml-2 ${
                        company.alignment >= 70 ? 'bg-emerald-100 text-emerald-700' :
                        company.alignment >= 40 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {company.alignment}%
                      </span>
                    )}
                    <span className="text-gray-300 text-xs shrink-0 ml-2">→</span>
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
