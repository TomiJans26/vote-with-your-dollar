import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { marked } from 'marked';

export default function Privacy() {
  const [html, setHtml] = useState('');

  useEffect(() => {
    fetch('/privacy.md')
      .then(r => r.text())
      .then(md => setHtml(marked.parse(md)));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-block mb-4 text-sm text-teal-600 hover:underline">← Back</Link>
        <div
          className="bg-white rounded-2xl shadow-lg p-6 md:p-10 prose prose-sm prose-teal max-w-none
            prose-headings:text-teal-800 prose-a:text-teal-600 prose-strong:text-gray-800
            prose-li:text-gray-600 prose-p:text-gray-600"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
