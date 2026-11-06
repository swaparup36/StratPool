export const VAULT_DEPLOYER_ADDRESS = "0xE109Aefe0C332F451Ffd9E892133b5DEE6A5F1A3";
export const COMMISSION_MANAGER_ADDRESS = "0xa639d9fD47dbA62f5803Fd03752BF5b8836b74B4";
export const SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

export const vaultDeployerAbi = [
  {
    type: "constructor",
    inputs: [
      { name: "_commissionManagerAddress", type: "address", internalType: "address" },
      { name: "_swapRouter", type: "address", internalType: "address" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "commissionManagerAddress",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "createVault",
    inputs: [],
    outputs: [{ name: "vaultAddress", type: "address", internalType: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getVault",
    inputs: [{ name: "investor", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "swapRouter",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "vaultOf",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "VaultCreated",
    inputs: [
      { name: "investor", type: "address", indexed: true, internalType: "address" },
      { name: "vault", type: "address", indexed: true, internalType: "address" },
    ],
    anonymous: false,
  },
  { type: "error", name: "InvalidAddress", inputs: [] },
  { type: "error", name: "VaultAlreadyExists", inputs: [] },
] as const;
