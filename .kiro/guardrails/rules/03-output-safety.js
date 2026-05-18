module.exports = {
  name: 'output-safety',
  type: 'output',
  async evaluate(input, config) {
    const output = (input.text || input.content || input.response || input.tool_response?.text || '').toString();
    const ruleConfig = config.rules?.output || {};

    if (!output) return { action: 'allow', rule: 'output-safety' };

    if (ruleConfig.max_output_length && output.length > ruleConfig.max_output_length) {
      return { action: 'warn', reason: `Output exceeds max length (${output.length} > ${ruleConfig.max_output_length})`, rule: 'output-safety' };
    }

    if (ruleConfig.block_hallucination_markers) {
      const hallucinationMarkers = [
        'i cannot actually', 'i do not have access', 'as an ai', 'i am an ai',
        'i am not able to', 'i cannot access', 'based on my training',
        'i do not have the ability to'
      ];
      for (const marker of hallucinationMarkers) {
        if (output.toLowerCase().includes(marker)) {
          return { action: 'warn', reason: `Output contains hallucination marker: "${marker}"`, rule: 'output-safety' };
        }
      }
    }

    if (ruleConfig.block_unsafe_code_generation) {
      const unsafeCode = [/<script\b[^>]*>.*?<\/script>/is, /onerror\s*=/i, /onload\s*=/i, /javascript:\s*/i];
      for (const pat of unsafeCode) {
        if (pat.test(output)) {
          return { action: 'warn', reason: 'Output contains potentially unsafe code patterns', rule: 'output-safety' };
        }
      }
    }

    return { action: 'allow', rule: 'output-safety' };
  }
};
