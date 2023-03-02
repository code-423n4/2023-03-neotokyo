// NTMintBridge (new contract)
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//    1. Delegate contract called by each item contract when a new NFT is minted 
//       in exchange for burning bytes
//    2. Will be set as the owner for the item contracts
//    3. Whenever a new item is minted, increase the cost of bytes to be burned 
//       in that item contract
//    4. Passes bytes to be burned to the bytes contract burn function