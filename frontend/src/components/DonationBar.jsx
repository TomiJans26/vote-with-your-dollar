export default function DonationBar({ percentDem = 50, percentRep = 50, className = '' }) {
  return (
    <div className={`w-full h-4 rounded-full overflow-hidden flex bg-gray-200 ${className}`}>
      <div
        className="bg-blue-500 transition-all duration-500"
        style={{ width: `${percentDem}%` }}
      />
      <div
        className="bg-red-500 transition-all duration-500"
        style={{ width: `${percentRep}%` }}
      />
    </div>
  );
}
