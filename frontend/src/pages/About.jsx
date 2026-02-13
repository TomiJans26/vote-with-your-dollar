export default function About() {
  return (
    <div className="p-4 space-y-4 max-w-prose mx-auto">
      <div className="text-center pt-2">
        <div className="text-5xl mb-2">🗳️</div>
        <h2 className="text-xl font-bold text-teal-800">About VWYD</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-5 space-y-4 text-sm text-gray-700 leading-relaxed">
        <section>
          <h3 className="font-bold text-teal-800 mb-1">What is this?</h3>
          <p>
            <strong>Vote With Your Dollar</strong> helps you understand the political
            impact of your everyday purchases. Scan a product barcode to discover which
            parent company makes it and where their political donations go.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-teal-800 mb-1">How it works</h3>
          <ol className="list-decimal ml-4 space-y-1">
            <li>Scan a product barcode (or enter it manually)</li>
            <li>We identify the product and its parent company</li>
            <li>We look up the company's Political Action Committee (PAC) donations using FEC data</li>
            <li>You see a breakdown of donations to Democrats vs Republicans</li>
            <li>Based on your preferences, we show alignment and suggest alternatives</li>
          </ol>
        </section>

        <section>
          <h3 className="font-bold text-teal-800 mb-1">Data Sources</h3>
          <ul className="list-disc ml-4 space-y-1">
            <li><strong>Product data:</strong> Open Food Facts, UPCitemdb</li>
            <li><strong>Company/brand mapping:</strong> Curated database of 50+ parent companies and 600+ brands</li>
            <li><strong>Political donations:</strong> Federal Election Commission (FEC) via OpenFEC API — PAC contributions to candidates</li>
          </ul>
        </section>

        <section>
          <h3 className="font-bold text-teal-800 mb-1">Limitations</h3>
          <ul className="list-disc ml-4 space-y-1">
            <li>PAC donations are only one dimension of corporate political activity</li>
            <li>Not all companies have US-registered PACs</li>
            <li>Individual employee donations are not included</li>
            <li>Brand ownership changes — our data may lag behind acquisitions</li>
          </ul>
        </section>

        <section>
          <h3 className="font-bold text-teal-800 mb-1">Privacy</h3>
          <p>
            Your preferences are stored locally on your device. We don't track your scans
            or sell any data. This is an open-source project.
          </p>
        </section>
      </div>

      <p className="text-center text-xs text-gray-400 pb-4">
        Built with ❤️ for informed consumers everywhere.
      </p>
    </div>
  );
}
