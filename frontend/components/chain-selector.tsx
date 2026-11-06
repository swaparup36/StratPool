"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Icon } from "./icon";
import { buttonClass } from "./ui";

export function ChainSelector() {
  return (
    <ConnectButton.Custom>
      {({ chain, mounted, openChainModal, openConnectModal }) => {
        if (!mounted) return null;
        return (
          <button
            className={`${buttonClass("secondary", "sm")} col-span-2`}
            type="button"
            aria-label={chain ? `Network: ${chain.name}. Change network` : "Connect wallet"}
            onClick={chain ? openChainModal : openConnectModal}
          >
            {!chain ? "Connect wallet" : chain.unsupported ? "Unsupported network" : chain.name}
            {chain && <Icon name="chevron" />}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
