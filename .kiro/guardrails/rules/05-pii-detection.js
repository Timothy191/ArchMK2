const piiPatterns = [
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/, name: 'SSN' },
  { pattern: /\b\d{16}\b/, name: 'Credit Card (raw digits)' },
  { pattern: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/, name: 'Credit Card (formatted)' },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, name: 'Email' },
  { pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, name: 'IP Address' },
  { pattern: /\b(?:[\+\d]{1,3})?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/, name: 'Phone Number' },
];

module.exports = {
  name: 'pii-detection',
  type: '*',
  async evaluate(input, config) {
    const text = JSON.stringify(input);
    for (const { pattern, name } of piiPatterns) {
      if (pattern.test(text)) {
        return { action: 'warn', reason: `Potential PII detected: ${name}`, rule: 'pii-detection' };
      }
    }
    return { action: 'allow', rule: 'pii-detection' };
  }
};
