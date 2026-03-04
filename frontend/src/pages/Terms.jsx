import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { marked } from 'marked';

export default function Terms() {
  const [html, setHtml] = useState('');

  useEffect(() => {
    fetch('/terms.md')
      .then(r => r.text())
      .then(md => setHtml(marked.parse(md)));
  }, []);

  return (
    <div className="min-h-screen bg-dark-bg p-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-block mb-4 text-sm text-aligned hover:underline">← Back</Link>
        <div
          className="glass-card rounded-2xl shadow-lg p-6 md:p-10 prose prose-sm prose-teal max-w-none
            prose-headings:text-gradient prose-a:text-aligned prose-strong:text-dark-text
            prose-li:text-dark-text-secondary prose-p:text-dark-text-secondary"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
