const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

export const formatKyat = (amount: number): string =>
  `${numberFormatter.format(amount)} Ks`;

export const formatTicketPrice = (price: number): string =>
  price === 0 ? "Free" : formatKyat(price);
