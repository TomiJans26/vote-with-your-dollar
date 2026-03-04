export default function DonationBar({ percentDem = 50, percentRep = 50, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
        <span className="text-dem">Democrat {percentDem}%</span>
        <span className="text-rep">Republican {percentRep}%</span>
      </div>
      <div className="w-full h-3 rounded-full overflow-hidden flex glass border border-dark-border-subtle">
        <div
          className="bg-gradient-to-r from-dem to-dem-dark transition-all duration-700 ease-out"
          style={{ 
            width: `${percentDem}%`,
            boxShadow: percentDem > 0 ? '0 0 10px rgba(59, 130, 246, 0.3)' : 'none'
          }}
        />
        <div
          className="bg-gradient-to-r from-rep-dark to-rep transition-all duration-700 ease-out"
          style={{ 
            width: `${percentRep}%`,
            boxShadow: percentRep > 0 ? '0 0 10px rgba(239, 68, 68, 0.3)' : 'none'
          }}
        />
      </div>
    </div>
  );
}
