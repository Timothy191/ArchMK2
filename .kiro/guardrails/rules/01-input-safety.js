const secretPatterns = [
  /AKIA[0-9A-Z]{16}/,
  /sk-[A-Za-z0-9_\-]{20,}/,
  /gh[pousr]_[A-Za-z0-9]{36,}/,
  /-----BEGIN.*PRIVATE KEY-----/
];

module.exports = {
  name: 'input-safety',
  type: 'input',
  async evaluate(input, config) {
    const prompt = (input.prompt || input.text || input.tool_input?.command || input.tool_input?.content || '').toString();
    const ruleConfig = config.rules?.input || {};

    if (ruleConfig.block_patterns) {
      for (const pattern of ruleConfig.block_patterns) {
        if (prompt.toLowerCase().includes(pattern.toLowerCase())) {
          return { action: 'block', reason: `Prompt contains banned pattern: "${pattern}"`, rule: 'input-safety' };
        }
      }
    }

    if (ruleConfig.max_prompt_length && prompt.length > ruleConfig.max_prompt_length) {
      return { action: 'warn', reason: `Prompt exceeds max length (${prompt.length} > ${ruleConfig.max_prompt_length})`, rule: 'input-safety' };
    }

    if (ruleConfig.block_secrets_in_prompt) {
      for (const pat of secretPatterns) {
        if (pat.test(prompt)) {
          return { action: 'block', reason: 'Prompt contains potential secret/credential', rule: 'input-safety' };
        }
      }
    }

    if (prompt.includes('eval(') || prompt.includes('exec(') || prompt.includes('require(')) {
      return { action: 'warn', reason: 'Prompt contains dynamic code execution patterns', rule: 'input-safety' };
    }

    return { action: 'allow', rule: 'input-safety' };
  }
};
