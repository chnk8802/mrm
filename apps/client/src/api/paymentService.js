import api from './axiosInstance';

const paymentService = {
    getPayments:          (params = {}) => api.get('/payments', { params }).then(r => r.data),
    getPaymentById:       (id)          => api.get(`/payments/${id}`).then(r => r.data),
    getPaymentStats:      ()            => api.get('/payments/stats').then(r => r.data),
    createPayment:        (data)        => api.post('/payments', data).then(r => r.data),
    createFullAndFinal:   (data)        => api.post('/payments/full-and-final', data).then(r => r.data),
};

export default paymentService;