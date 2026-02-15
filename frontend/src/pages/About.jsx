export default function About() {
  return (
    <div className="p-4 space-y-4 max-w-prose mx-auto">
      <div className="text-center pt-2">
        <div className="text-5xl mb-2">🗳️</div>
        <h2 className="text-xl font-bold text-teal-800">About DollarVote</h2>
      </div>

      {/* Mission Statement */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl shadow-lg p-6 text-center">
        <p className="text-white text-lg font-bold leading-relaxed italic">
          "I want to spend my money with companies that use the profits gained from me
          for investments in values that matter to me."
        </p>
        <p className="text-teal-200 text-sm mt-3 font-semibold">
          Shift your dollars to match your values.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-5 space-y-4 text-sm text-gray-700 leading-relaxed">
        <section>
          <h3 className="font-bold text-teal-800 mb-1">What is this?</h3>
          <p>
            <strong>Vote With Your Dollar</strong> helps you shift your spending to companies
            that share your values. Scan a product barcode to discover who really profits from
            your purchase — and find better-aligned alternatives you can buy instead.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-teal-800 mb-1">How it works</h3>
          <ol className="list-decimal ml-4 space-y-1">
            <li>Tell us what values matter to you during onboarding</li>
            <li>Scan a product barcode (or search by brand)</li>
            <li>We identify the parent company and score them against your values</li>
            <li>See exactly where you align and where you clash — on issues like climate, labor rights, LGBTQ+ rights, and more</li>
            <li>Get <strong>personalized product alternatives</strong> with specific reasons why they're a better match for you</li>
          </ol>
        </section>

        <section>
          <h3 className="font-bold text-teal-800 mb-1">Data Sources</h3>
          <ul className="list-disc ml-4 space-y-1">
            <li><strong>Product data:</strong> Open Food Facts, UPCitemdb</li>
            <li><strong>Company/brand mapping:</strong> Curated database of 100+ parent companies and 600+ brands</li>
            <li><strong>Political donations:</strong> Federal Election Commission (FEC) via OpenFEC API</li>
            <li><strong>Company issue stances:</strong> Curated from public reports, news, and corporate disclosures</li>
          </ul>
        </section>

        <section>
          <h3 className="font-bold text-teal-800 mb-1">Limitations</h3>
          <ul className="list-disc ml-4 space-y-1">
            <li>Company stances are simplified — reality is nuanced</li>
            <li>Not all companies have US-registered PACs</li>
            <li>Brand ownership changes — our data may lag behind acquisitions</li>
            <li>Alternative suggestions depend on product availability in Open Food Facts</li>
          </ul>
        </section>

        <section>
          <h3 className="font-bold text-teal-800 mb-1">Privacy</h3>
          <p>
            Your belief profile is stored locally and synced to your account when signed in.
            Scan history is saved to help you track your shopping habits over time.
            We never sell individual user data. Period.
          </p>
        </section>
      </div>

      <p className="text-center text-xs text-gray-400 pb-4">
        Built with ❤️ for conscious consumers everywhere.
      </p>
    </div>
  );
}
