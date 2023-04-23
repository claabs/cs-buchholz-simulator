export const rateToPctString = (rate: number, precision = 0) => {
  return rate.toLocaleString(undefined, {
    style: 'percent',
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
};
