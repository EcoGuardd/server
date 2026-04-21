export const calculateImpact = (numberOfTrees, co2PerTreeStr = null) => {
    // Standard baseline for calculation
    const avgCo2PerTree = co2PerTreeStr ? parseFloat(co2PerTreeStr) : 21.7; 
    
    const totalCo2Kg = numberOfTrees * avgCo2PerTree;
    
    return {
        co2SavedPerYear: totalCo2Kg,
        co2SavedPerYearTons: totalCo2Kg / 1000,
        oxygenProduced: numberOfTrees * 100,
        landCoverage: numberOfTrees * 5
    };
};
