const from  = rxjs.from
const takeUntil = rxjs.takeUntil
const Web3Modal = window.Web3Modal.default;
let web3i;
let contract;
let isAuth=0;
var WalletConnectProvider=WalletConnectProvider.default;
const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        bridge: "https://bridge.walletconnect.org",
        rpc: {
        25: "https://evm-cronos.crypto.org",
        },
        chainId: 25,
        network: "cronos",
  
    }
    }
  }

const anyProviderObserver =
     async() => {
        try {
        provider=new Web3.providers.HttpProvider('https://evm-cronos.crypto.org');
        const providerWrapper = new ethers.providers.Web3Provider(provider)
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, providerWrapper)
        setGlobalStatisticsEvents(contract)
    }
    catch(Exception){
        console.log(Exception)
    }
    onNoWalletsConnected()        
    }

const walletChoosingObserver =  async() => {
        try {
                web3Modal = new Web3Modal({
                network: "cronos", // replace mainnet to binance
                providerOptions, // required
            });
        provider = await web3Modal.connect();
        web3i=provider
        console.log(provider)
        const providerWrapper = new ethers.providers.Web3Provider(provider)
        console.log(await providerWrapper.listAccounts())
        const signer = providerWrapper.getSigner(0)
        contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer)
        const tokenContract = new ethers.Contract(USDC_CONTRACT_ADDRESS, tokenABI, signer);
        console.log(signer)
        await checkUserWallet()
        const accountsChangeObservable = accountsChangeObservableFactory(provider)
        accountsChangeObservable.subscribe(accounts => setPersonalStatisticsEvents(providerWrapper, contract, tokenContract, accounts[0]))
        const requestAccountObservable = from(requestAccounts(provider)).pipe(takeUntil(accountsChangeObservable)) 
        requestAccountObservable.subscribe(accounts => setPersonalStatisticsEvents(providerWrapper, contract, tokenContract, accounts[0]))
        setGlobalStatisticsEvents(contract)

            }
            catch(Exception){
                console.log(Exception)
            }
        
    }
