// Test volume formatting

const formatNumber = (num) => {
  if (!num || num === 0) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
};

// Test with different volume values
const testVolumes = [
  850000000000000, // Large lamports value
  850000000000000 / 1e9, // Converted to SOL
  850000, // Medium value
  1250, // Small value
  0.5, // Very small value
];

console.log('Volume formatting tests:');
testVolumes.forEach((volume, index) => {
  console.log(`${index + 1}. ${volume} -> ${formatNumber(volume)}`);
});

// Test transaction amount formatting
const formatTransactionAmount = (amountToken) => {
  const amount = amountToken / 10000;
  return `${Math.round(amount * 10) / 10}M`;
};

const testAmounts = [
  1788384000000, // From user example
  178838400, // Smaller amount
  1000000, // 1M tokens
];

console.log('\nTransaction amount formatting tests:');
testAmounts.forEach((amount, index) => {
  console.log(`${index + 1}. ${amount} -> ${formatTransactionAmount(amount)}`);
});