let _token = null;
let _farmId = null;

export const setToken = (t) => { _token = t; };
export const getToken = () => _token;
export const setFarmId = (id) => { _farmId = id; };
export const getFarmId = () => _farmId;
