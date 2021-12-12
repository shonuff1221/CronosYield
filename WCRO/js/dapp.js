const fromEvent = rxjs.fromEvent
const mergeMap = rxjs.mergeMap
const map = rxjs.map
const merge = rxjs.merge
const timer = rxjs.timer

const CONTRACT_ADDRESS = '0x07285028DBDd09483FA150A80B07496054fDc7AD'
const WCRO_CONTRACT_ADDRESS = "0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23"
const DEFAULT_REFERRAL = '0x1799dADA49693dA4aB9ec838aD29E00F704E8718'

const DEPOSIT_PERIOD_MIN = 7
const DEPOSIT_TOTAL_PROFIT_MIN = 119
const DEPOSIT_INCREASING_STEP = 5
const CURRENCY_DIGITS_AFTER_DOT = 4

const MIN_VALUE = "10000000000000000000" // wei
const TRANSACTION_FEE = ethers.utils.parseEther('1')
const gasPrice = "5000"

const DEPOSIT_AMOUNT_INPUT = $('#depositAmount')

const REFERRAL_KEY = 'REFERRAL'

const INVEST_BUTTON_CONTENT_ON_TRANSACTION_RUNNING = '<div class="spinner"></div>'
const APPROVE_BUTTON_CONTENT_ON_TRANSACTION_RUNNING = '<div class="spinner"></div>'
const INVEST_BUTTON_CONTENT_ON_TRANSACTION_DONE = 'Invest'
const WITHDRAW_BUTTON_CONTENT_ON_TRANSACTION_RUNNING = '<div class="spinner"></div>'
const WITHDRAW_BUTTON_CONTENT_ON_TRANSACTION_DONE = 'Withdraw'
const APPROVE_BUTTON_CONTENT_ON_TRANSACTION_FAIL = "Approve"


// let checkAttempt = 0;

function main () {
    $('#connectBtn').click(()=>walletChoosingObserver())
    getReferralFromStoreOrLink()
    anyProviderObserver()
    walletChoosingObserver()
    checkUserChainId()
    showNews()
    setInterval(showNews, 60000)// check if 10 min passed to show news again

    sliderObservable.subscribe(updateProfitByDepositPeriod)
    fromEvent(DEPOSIT_AMOUNT_INPUT, 'input').pipe(map(event => event.currentTarget.value)).subscribe(updateProfitByDepositAmount)
    setRouter()
    
}

function showWalletSelection () {
    console.log('Hi')
    $('#connectBtn').click()
}

function showNews() {
    const currentTime = Math.floor(new Date().getTime() / 1000);
    const messageTime = Number(window.localStorage.getItem("messageTime"))
    if(!messageTime || currentTime >= messageTime + 600){
        $(".wrapper-dark").addClass("active-bg");
        console.log($(".container-news"))
        $(".container-news").addClass("active-news");
        window.localStorage.setItem('messageTime', currentTime)
    }
    return;
}

async function onNoWalletsConnected () {
    const accountsChangedMerge = takeUntil(merge(accountChangedSubject, walletChangedSubject))
    fromEvent($('#investButton'), 'click').pipe(accountsChangedMerge).subscribe(showWalletSelection)
    fromEvent($('#withdrawButton'), 'click').pipe(accountsChangedMerge).subscribe(showWalletSelection)
}
async function checkUserWallet(){
   
    const wallet = window.localStorage.getItem("WALLET")
    if(wallet === "ethereum" && !isMetaMaskInstalled()){
        return;
    } else if (wallet === "ethereum" && isMetaMaskInstalled()) {
        window.ethereum.on("chainChanged", () => window.location.reload())
        //If it is installed we change our button text
        // onboardButton.appendChild(document.createElement("p").innerText = "Connect")
        await checkUserChainId().then(res => res).catch(e => console.log(e))
        return;
       
    }else if (wallet === "CronosChain" && !isCronosChainWallet()){
        if(checkAttempt > 5) {
            return;
        }
        checkAttempt++
        setTimeout(checkUserWallet,800)// Cronos chain wallet take some time to load
    }else if (wallet === "CronosChain" && isCronosChainWallet() ){
        window.CronosChain.on("chainChanged", () => window.location.reload())
        await checkUserChainId().then(res => res).catch(e => console.log(e))
        return;
    }else {
        return;
    }
}

const isMetaMaskInstalled = () => {
    //Have to check the ethereum binding on the window object to see if it's installed
    const { ethereum } = window;
    return Boolean(ethereum && ethereum.isMetaMask);
};

const isCronosChainWallet = () => {
    const { CronosChain } = window;
    return Boolean(CronosChain);
}

async function checkUserChainId() {
    const wallet = window.localStorage.getItem("WALLET")
    if(wallet === "ethereum" && window.ethereum.chainId === null) {
        setTimeout(checkUserChainId, 800)
        return
    }
    console.log(Number.parseInt(window.ethereum.chainId))
    if(wallet === "ethereum" && window.ethereum.chainId && (Number.parseInt(window.ethereum.chainId) !== 25)){
        
        const res = confirm('Switch to mainnet, please.')
            if(res){
              try{
              await window.ethereum.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: '0x25' }],
                });
              } catch (switchError) {
               
                // This error code indicates that the chain has not been added to MetaMask.
                if (switchError.code === 4902) {
                  try {

                   const res =  await window.ethereum.request({
                      method: 'wallet_addEthereumChain',
                      params: [
                        {
                          chainId: '0x25',
                          chainName: 'Cronos SmartChain Mainnet',
                          nativeCurrency: {
                            name: 'Cronos',
                            symbol: 'CRO',
                            decimals: 18
                          },
                          rpcUrls: ['https://evm-cronos.crypto.org'],
                          blockExplorerUrls: ['https://cronos.crypto.org/explorer/']
                        }
                      ],
                    });

                  } catch (addError) {

                    console.log(addError);
                  }
                }
                // handle other "switch" errors
              }
            }
    }else if(wallet === "CronosChain" && window.CronosChain.chainId && Number.parseInt(window.CronosChain.chainId) !== 25){
        const params = [{
            chainId: '0x61',
            chainName: 'Cronos SmartChain',
            nativeCurrency: {
              name: 'Cronos',
              symbol: 'CRO',
              decimals: 18
            },
            rpcUrls: ['https://evm-cronos.crypto.org'],
            blockExplorerUrls: ['https://cronos.crypto.org/explorer/']

          }]
          const res = confirm(`Please switch network to ${params[0].chainName}.`)
          if(res) {
            CronosChain.switchNetwork("bsc-mainnet")
          }
        }
}
async function setGlobalStatisticsEvents (contract) {
    const [invested, withdrawn, matchBonus] = await contract.contractInfo()
    console.log(invested, withdrawn, matchBonus)
    $('#totalCurrencyInvested').text(''+Math.round(formatCurrency(invested)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","))
    $('#totalReferralReward').text(''+Math.round(formatCurrency(matchBonus)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","))
}

function setPersonalStatisticsEvents (provider, contract, tokenContract, currentAccount) {
    setPersonalStatistics(contract, tokenContract, currentAccount)
    onAccountsChanged(currentAccount)
    const personalStatisticsSubscriber = {
        next: () => setPersonalStatistics(contract, tokenContract, currentAccount),
        complete: () => showWarningPopup('Transaction done', 'Transaction done', 5000)
    }

    const bnbBalance = provider.getBalance(currentAccount).then(accountBalance =>accountBalance);
    

    tokenContract.balanceOf(currentAccount).then(tokenBalance => {
        const accountsChangedMerge = takeUntil(merge(accountChangedSubject, walletChangedSubject))
        fromEvent($('#approveButton'), 'click').pipe(accountsChangedMerge).subscribe(() => approve(tokenContract, personalStatisticsSubscriber))
        fromEvent($('#investButton'), 'click').pipe(accountsChangedMerge).subscribe(() => invest(contract, tokenContract, currentAccount, bnbBalance, tokenBalance, personalStatisticsSubscriber))
        fromEvent($('#maxAmountButton'), 'click').pipe(accountsChangedMerge).subscribe(() => setMaxDepositAmount(tokenBalance))
    })

    fromEvent($('#withdrawButton'), 'click').pipe(takeUntil(merge(accountChangedSubject, walletChangedSubject))).subscribe(() => withdraw(contract, personalStatisticsSubscriber))
}

async function setPersonalStatistics (contract, tokenContract, currentAccount) {
    const [forWithdraw, totalInvested, totalWithdrawn, totalMatchBonus, structure] = await contract.userInfo(currentAccount)
    const userAllowance = await tokenContract.allowance(currentAccount, contract.address);
    updatePersonalStatisticsDashboard(forWithdraw, totalInvested, totalWithdrawn, totalMatchBonus, structure, userAllowance)

    showRefLink(totalInvested, currentAccount)
}

function updatePersonalStatisticsDashboard(forWithdraw, totalInvested, totalWithdrawn, totalMatchBonus, structure, userAllowance) {
    
    if(Number.parseInt(userAllowance) > 0) {

        const investButton = document.getElementById('investButton');
        investButton.style.display = "block"
        const approveButton = document.getElementById('approveButton');
        approveButton.style.display = "none"
     }
 
    $('#toWithdraw').text(formatCurrency(forWithdraw))
    $('#investedByUser').text(formatCurrency(totalInvested))
    $('#withdrawalByUser').text(formatCurrency(totalWithdrawn))
    $('#refRewardForUser').text(formatCurrency(totalMatchBonus))

    for (let i = 0; i < structure.length; i++) {
        $('#referralsCountAtLevel' + (i + 1)).text(structure[i])
    }
}

function updateProfitByDepositPeriod (depositPeriod) {
    $('#days').text(depositPeriod)
    const totalProfitPercent = getTariffTotalProfit(depositPeriod)
    
    $('#dailyRoi').text(floorToSmaller(totalProfitPercent / depositPeriod, 2) + '%')
    $('#totalProfitPercent').text(totalProfitPercent + '%')
    $('#profitCurrencyValue').text(floorToNumber(getEarningsByDepositAmountAndProfitPercent(DEPOSIT_AMOUNT_INPUT.val(), totalProfitPercent)))
}

 function updateProfitByDepositAmount (depositAmount) {
    const depositPeriod = $('#depositPeriodDays').text()
    const totalProfitPercent = getTariffTotalProfit(depositPeriod)

    $('#totalProfitPercent').text(totalProfitPercent + '%')
    $('#profitCurrencyValue').text(floorToNumber(getEarningsByDepositAmountAndProfitPercent(DEPOSIT_AMOUNT_INPUT.val(), totalProfitPercent)))
}

function showRefLink (totalInvested, currentAccount) {
    const refLink = $('#refLink')

    if (totalInvested.eq(0)) {
        refLink.text('You will get your ref link after investing')
    } else {
        const link = window.location + '?ref=' + currentAccount
        refLink.text(link)

        fromEvent($('#copyButton'), 'click').pipe(takeUntil(merge(accountChangedSubject, walletChangedSubject))).subscribe(() => {
            copyText(link)

            const copiedSuccessfully = $('#copiedSuccessfully')
            copiedSuccessfully.show()
            timer(5000).pipe(takeUntil(merge(accountChangedSubject, walletChangedSubject))).subscribe({
                next: () => copiedSuccessfully.hide(),
                complete: () => copiedSuccessfully.hide()
            })
        })
    }
}

async function requestAccounts (provider) {
    if(provider.accounts) return  provider.accounts
    let ret=await provider.request({ method: 'eth_requestAccounts' })
    console.log(ret)
    return ret
}

async function invest(contract, tokenContract, userAddress, accountBalance, tokenBalance, dashboardObserver) {
    const investButton = $('#investButton')
    const tariffId = $('#depositPeriodDays').text()
    const value = ethers.utils.parseEther($('#depositAmount').val())
    const buttonStateObserver = {
        next: () => investButton.empty().append(INVEST_BUTTON_CONTENT_ON_TRANSACTION_RUNNING),
        complete: () => {investButton.attr("disabled", false); investButton.text(INVEST_BUTTON_CONTENT_ON_TRANSACTION_DONE)}
    }

        if (value.lt(MIN_VALUE)) {
        showErrorPopup('Deposit amount incorrect', 'Min deposit amount is 10 WCRO', 5000)
        return
    }


    if (value.gt(tokenBalance)) {
        showErrorPopup('Not enough WCRO', 'Not enough WCRO to make an investment', 5000)
        return
    }

    if(accountBalance < TRANSACTION_FEE){
        showErrorPopup('Not enough WCRO', 'Not enough WCRO to process your transaction', 5000)
        return
    }
    investButton.empty().append(INVEST_BUTTON_CONTENT_ON_TRANSACTION_RUNNING)
    investButton.attr("disabled", true)

    const currentAllowance = await tokenContract.allowance(userAddress, CONTRACT_ADDRESS)
    console.log(tariffId)
    if(currentAllowance.lt(value)){
        console.log('Approving')
        approve(tokenContract).then(res => {
            contract.deposit(tariffId, getReferralFromStoreOrLink(), value, {gasPrice: ethers.utils.parseUnits(gasPrice, "gwei")}).then(tx => {
                const transactionObservable = transactionObservableFactory(tx)
                transactionObservable.subscribe(dashboardObserver)
                transactionObservable.subscribe(buttonStateObserver)
                gtag('event', 'deposit', {
                    'event_category': 'conversion',
                    'event_label': 'deposit',
                    value
                  });
            }).catch((err) => { console.log(err); investButton.attr("disabled", false); investButton.text(INVEST_BUTTON_CONTENT_ON_TRANSACTION_DONE)})
        })

        }else {
        contract.deposit(tariffId, getReferralFromStoreOrLink(), value, {gasPrice: ethers.utils.parseUnits(gasPrice, "gwei")}).then(tx => {
            const transactionObservable = transactionObservableFactory(tx)
            transactionObservable.subscribe(dashboardObserver)
            transactionObservable.subscribe(buttonStateObserver)
            gtag('event', 'deposit', {
                'event_category': 'conversion',
                'event_label': 'deposit',
                value
              });
        }).catch((err) => { console.log(err); investButton.text(INVEST_BUTTON_CONTENT_ON_TRANSACTION_DONE); investButton.attr("disabled", false)}) 
    }
}
async function approve(tokenContract) {
    const approveButton = $('#approveButton')
    const buttonToRemove = document.getElementById('approveButton')
    const investButton = $('#investButton')
      try {
       const buttonStateObserver = {
           next: () => approveButton.empty().append(INVEST_BUTTON_CONTENT_ON_TRANSACTION_RUNNING),
           complete: () => {approveButton.css("display", "none"); investButton.css("display", "block")
           showWarningPopup('Transaction successful', "Tokens were approved!", 5000)}
       }
       approveButton.empty().append(APPROVE_BUTTON_CONTENT_ON_TRANSACTION_RUNNING)
       approveButton.attr("disabled", true);
       let maxAllowance = ethers.BigNumber.from(2).pow(256).sub(1);
   
       const rawResult = await tokenContract.approve(CONTRACT_ADDRESS, maxAllowance, {gasPrice: ethers.utils.parseUnits(gasPrice, "gwei")});
       const transactionObservable = transactionObservableFactory(rawResult)
       
       transactionObservable.subscribe(buttonStateObserver)
       
      } catch (error) {
          console.log(error)
        approveButton.attr("disabled", false);
       approveButton.text(APPROVE_BUTTON_CONTENT_ON_TRANSACTION_FAIL)
      }
   }


function withdraw (contract, dashboardObserver) {
    const withdrawButton = $('#withdrawButton')
    const buttonStateObserver = {
        next: () => withdrawButton.empty().append(WITHDRAW_BUTTON_CONTENT_ON_TRANSACTION_RUNNING),
        complete: () => withdrawButton.text(WITHDRAW_BUTTON_CONTENT_ON_TRANSACTION_DONE)
    }

    withdrawButton.empty().append(WITHDRAW_BUTTON_CONTENT_ON_TRANSACTION_RUNNING)
    contract.withdraw({gasPrice: ethers.utils.parseUnits(gasPrice, "gwei")}).then(tx => {
        const transactionObservable = transactionObservableFactory(tx)
        transactionObservable.subscribe(dashboardObserver)
        transactionObservable.subscribe(buttonStateObserver)
    }).catch(() => withdrawButton.text(WITHDRAW_BUTTON_CONTENT_ON_TRANSACTION_DONE))
}

function setMaxDepositAmount (tokenBalance) {
    $('#depositAmount').val(formatCurrency(tokenBalance))
}
function onAccountsChanged (currentAccount) {
    accountChangedSubject.next(1)
    $('#buttonConnectContent').text(getShorterAddress(currentAccount))
}

function getShorterAddress (address, tailsLength = 3) {
    return address.substring(0, tailsLength) + '...' + address.substring(address.length - tailsLength, address.length)
}

/**
 * 
 * @param {number} depositPeriod 
 * @param {number} periodMin 
 * @param {number} profitMin 
 * @param {number} step 
 * @returns 
 */
function getTariffTotalProfit (depositPeriod, periodMin=DEPOSIT_PERIOD_MIN, profitMin=DEPOSIT_TOTAL_PROFIT_MIN, step=DEPOSIT_INCREASING_STEP) {
    return profitMin + (depositPeriod - periodMin) * step
}

function getEarningsByDepositAmountAndProfitPercent (amount, profitPercent) {
    return amount * profitPercent / 100
}

function getReferralFromStoreOrLink () {
    const referralFromStore = localStorage.getItem(REFERRAL_KEY)
    const referralFromLink = getUrlParameter('ref')

    if (referralFromLink) {
        localStorage.setItem(REFERRAL_KEY, referralFromLink)
        return referralFromLink
    }

    if (referralFromStore) {
        return referralFromStore
    }

    return DEFAULT_REFERRAL
}

function getUrlParameter (sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return typeof sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
    return false;
}

function formatCurrency (value) {
    return floorToSmaller(Number.parseFloat(ethers.utils.formatEther(value)))
}

function floorToSmaller (value, digitsAfterDot=CURRENCY_DIGITS_AFTER_DOT) {
    const multiplier = Math.pow(10, digitsAfterDot)
    return Math.floor(value * multiplier) / multiplier
}

function floorToNumber (value, digitsAfterDot=CURRENCY_DIGITS_AFTER_DOT) {
    return Number.parseFloat(value.toFixed(digitsAfterDot))
}

function setRouter () {
    $('#contractLink').click(openContractExplorer)
}

function openContractExplorer () {
    window.open(`https://cronos.crypto.org/explorer/address/${CONTRACT_ADDRESS}`, '_blank')
}

function copyText (text) {
    let textArea = document.createElement("textarea");

    textArea.style.position = "fixed";
    textArea.style.top = 0;
    textArea.style.left = 0;

    textArea.style.width = "2em";
    textArea.style.height = "2em";

    textArea.style.padding = 0;
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";

    textArea.style.background = "transparent";
    textArea.value = text;

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    document.execCommand("copy")
    textArea.parentElement.removeChild(textArea)
}

$(document).ready(main)
