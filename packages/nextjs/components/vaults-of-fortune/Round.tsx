import React, { useEffect, useState } from "react";
import { useScaffoldContractRead, useScaffoldEventSubscriber } from "~~/hooks/scaffold-eth";

type IRoundStateToName = {
  [key: number]: string;
};

export const Round = () => {
  const [countdown, setCountdown] = useState(90);
  const [startCountdown, setStartCountdown] = useState(false);

  const { data: roundNumber } = useScaffoldContractRead({
    contractName: "Market",
    functionName: "getCurrentRoundNumber",
  });

  const { data: roundState } = useScaffoldContractRead({
    contractName: "Market",
    functionName: "getCurrentRoundState",
  });

  const { data: roundInterval } = useScaffoldContractRead({
    contractName: "Market",
    functionName: "roundInterval",
  });

  useScaffoldEventSubscriber({
    contractName: "Market",
    eventName: "RoundOpen",

    listener: logs => {
      console.log("RoundOpen", logs);
      setStartCountdown(true);
    },
  });

  const roundStateToName: IRoundStateToName = {
    0: "Open",
    1: "Calculating",
    2: "Closed",
  };

  useEffect(() => {
    if (startCountdown) {
      // Set the initial value of the countdown
      setCountdown(Number(roundInterval) || 90);

      const interval = setInterval(() => {
        setCountdown(prevCountdown => (prevCountdown > 0 ? prevCountdown - 1 : 0));
      }, 1000); // Update every second

      return () => clearInterval(interval); // Clear the interval on component unmount
    }
  }, [roundInterval, startCountdown]);

  return (
    <>
      <h3 className="text-center text-3xl font-cubano mb-5">Round</h3>
      <div className="flex justify-between">
        <div className="text-center w-[140px]">
          <h5 className="text-xl">Number</h5>
          <div className="text-5xl text-white">{roundNumber?.toString()} of 3</div>
        </div>
        <div className="text-center w-[140px]">
          <h5 className="text-xl">State</h5>
          {roundState && <div className="text-5xl text-white">{roundStateToName[roundState]}</div>}
        </div>
        <div>
          <h5 className="text-xl text-center w-[140px]">Clock</h5>
          <div className="flex justify-center">
            <span className="countdown font-mono text-5xl ">
              <span style={{ "--value": countdown } as React.CSSProperties}></span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
