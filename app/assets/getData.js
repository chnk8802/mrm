async function fetchDataFromZoho(config) {
    try {
        const response = await ZOHO.CREATOR.API.getAllRecords(config);
        return response.data;
    } catch (error) {
        throw error;
    }
}