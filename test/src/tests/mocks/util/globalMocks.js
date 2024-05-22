const globalMocks = () => {

    global.session = {
        getCurrency: function() {
            return {
                getCurrencyCode: function() {
                    return 'USD'
                }
            }
        },
        custom: {
            KLEmailSubscribe: true,
            KLSmsSubscribe: true
        }
    }

    global.dw = {
        util: {
            StringUtils: {
                formatMoney: function () {
                    return '$9.99'
                },
                formatCalendar: function () {
                    return '2022-22-02'
                }
            },
            Calendar: function() {
                return '2022-22-02'
            }
        },
        value: {
            Money: function() {
                return '$9.00'
            }
        },
    }

}

module.exports = globalMocks