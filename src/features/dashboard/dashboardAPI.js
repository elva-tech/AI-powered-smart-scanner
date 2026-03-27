export const fetchDashboardAPI = async () => {
  await new Promise((res) => setTimeout(res, 800));

  return {
    success: true,
    data: {
      kpis: [
        { title: "Total Rules", value: 124 },
        { title: "Active Cases", value: 32 },
        { title: "Alerts", value: 7 },
      ],
    },
  };
};