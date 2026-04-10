const AVG_SPEED_KMH = 40;

const estimateEtaMinutes = (distanceKm) => {
    if (!distanceKm || distanceKm < 0) return 5;
    return Math.ceil((distanceKm / AVG_SPEED_KMH) * 60);
};

module.exports = { estimateEtaMinutes };
