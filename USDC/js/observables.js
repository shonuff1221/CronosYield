const Observable = rxjs.Observable

const METAMASK_KEY = 'ethereum'
const BINANCE_WALLET_KEY = 'CronosChain'
const WALLET_KEY = 'WALLET'

// const WALLET_CHANGED_EVENT_KEY = 'walletChanged'

const anyProviderObservable = new Observable(subscriber => {
    const maximumConnectionAttemptions = 10
    const nextConnectionTimeout = 100
    let connectAttemptions = 0

    onAnyProviderSearchingNextTry(subscriber, maximumConnectionAttemptions, nextConnectionTimeout, connectAttemptions)
})

const walletChoosingObservable = new Observable(subscriber => {
    onProviderSearchingByKeyNextTry(subscriber, METAMASK_KEY)
        .then(provider => onWaitingForWalletChoice(subscriber, provider, METAMASK_KEY, $('[id=connectBtn]')))
})

const sliderObservable = new Observable(subscriber => {
    subscriber.next(DEFAULT_VALUE_AT_RANGE)

    $("#js-slider").on('slide', (event, ui) => {
        subscriber.next(ui.value)
    })
})

function transactionObservableFactory (tx) {
    return new Observable(subscriber => {
        tx.wait().then(() => {
            subscriber.next()
            subscriber.complete()
        })
    })
}

function accountsChangeObservableFactory (provider) {
    return new Observable(subscriber => {
        provider.on('accountsChanged', accounts => subscriber.next(accounts))
        walletChangedSubject.subscribe(() => subscriber.complete())
    })
}

function onAnyProviderSearchingNextTry (subscriber, maximumConnectionAttemptions, nextConnectionTimeout, connectAttemptions) {
    if (window.ethereum) {
        subscriber.next(window.ethereum)
        subscriber.complete()
    } else if (window.BinanceChain) {
        subscriber.next(window.BinanceChain)
        subscriber.complete()
    } else {
        connectAttemptions++
        if (connectAttemptions < maximumConnectionAttemptions) {
            setTimeout(() => onAnyProviderSearchingNextTry(subscriber, maximumConnectionAttemptions, nextConnectionTimeout, connectAttemptions), nextConnectionTimeout)
        }
        else {
            // todo tell user to enable wallet and try to connect again
            subscriber.complete()
        }
    }
}

function onProviderSearchingByKeyNextTry (subscriber, providerKey) {
    const maximumConnectionAttemptions = 10
    const nextConnectionTimeout = 100
    let connectAttemptions = 0

    return new Promise((resolve, reject) => {
        if (window.hasOwnProperty(providerKey)) {
            resolve(window[providerKey])
        } else {
            connectAttemptions++
            if (connectAttemptions < maximumConnectionAttemptions) {
                setTimeout(() => onProviderSearchingByKeyNextTry(subscriber, providerKey), nextConnectionTimeout)
            } else {
                reject()
            }
        }
    })
}

function onWaitingForWalletChoice (subscriber, provider, providerKey, triggerEl) {
    if (localStorage.getItem(WALLET_KEY) == providerKey) {
        subscriber.next(provider)
    }
        triggerEl.click(() => {
            localStorage.setItem(WALLET_KEY, providerKey)
            // window.dispatchEvent(new Event(WALLET_CHANGED_EVENT_KEY))
            walletChangedSubject.next(1)
            subscriber(provider)
            closeWindow()
        })
}
