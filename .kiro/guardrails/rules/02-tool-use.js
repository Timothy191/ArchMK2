module.exports = {
  name: 'tool-use',
  type: 'tool-use',
  async evaluate(input, config) {
    const tool = (input.tool || input.tool_name || '').toString();
    const toolInput = input.tool_input || input.arguments || {};
    const ruleConfig = config.rules?.['tool-use'] || {};

    if (tool === 'Bash') {
      const command = (toolInput.command || '').toString();
      if (ruleConfig.dangerous_patterns) {
        for (const pattern of ruleConfig.dangerous_patterns) {
          if (command.includes(pattern)) {
            return { action: 'block', reason: `Dangerous command pattern: "${pattern}"`, rule: 'tool-use' };
          }
        }
      }
      if (command.length > 2000) {
        return { action: 'warn', reason: `Command too long (${command.length} chars)`, rule: 'tool-use' };
      }
    }

    if (tool === 'Edit' || tool === 'Write') {
      const filePath = (toolInput.file_path || toolInput.filePath || toolInput.TargetFile || '').toString();
      if (filePath.includes('.env') || filePath.includes('secret') || filePath.includes('credential')) {
        return { action: 'warn', reason: `Writing to sensitive file: ${filePath}`, rule: 'tool-use' };
      }
    }

    if (ruleConfig.max_tool_calls_per_step && input._tool_call_count > ruleConfig.max_tool_calls_per_step) {
      return { action: 'block', reason: `Too many tool calls in this step (${input._tool_call_count})`, rule: 'tool-use' };
    }

    return { action: 'allow', rule: 'tool-use' };
  }
};
