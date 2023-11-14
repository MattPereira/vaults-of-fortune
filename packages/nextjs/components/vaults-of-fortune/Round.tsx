import React, { useEffect, useState } from "react";
import { useScaffoldContractRead, useScaffoldEventSubscriber } from "~~/hooks/scaffold-eth";

type IRoundStateToName = {
  [key: number]: string;
};

export const Round = () => {
  // const [roiResults, setRoiResults] = useState({ round1: [], round2: [], round3: [] });

  const [countdown, setCountdown] = useState(99);
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

  useScaffoldEventSubscriber({
    contractName: "Market",
    eventName: "VaultROI",
    listener: logs => {
      logs.map(log => {
        const { vaultAddress, roundNumber, roi } = log.args;
        console.log("📡 vaultAddress", vaultAddress);
        console.log("📡 roundNumber", roundNumber);
        console.log("📡 roi", roi);
      });
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
      setCountdown(Number(roundInterval) || 99);

      const interval = setInterval(() => {
        setCountdown(prevCountdown => (prevCountdown > 0 ? prevCountdown - 1 : 0));
      }, 1000); // Update every second

      return () => clearInterval(interval); // Clear the interval on component unmount
    }
  }, [roundInterval, startCountdown]);

  return (
    <>
      <div className="mb-5">
        {/* <h3 className="text-center text-3xl font-cubano mb-5">Round</h3> */}
        <div className="stats shadow w-full">
          <div className="stat place-items-center">
            <div className="stat-title">Round</div>
            <div className="stat-value">{roundNumber?.toString()} of 3</div>
          </div>

          <div className="stat place-items-center">
            <div className="stat-title">State</div>
            <div className="stat-value">{roundState !== undefined && roundStateToName[roundState]}</div>
          </div>
          <div className="stat place-items-center">
            <div className="stat-title">Clock</div>
            <div className="stat-value">
              <div className="flex justify-center">
                <span className="countdown font-mono text-5xl ">
                  <span style={{ "--value": countdown } as React.CSSProperties}></span>
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* <div className="flex justify-between">
          <div className="text-center w-[140px]">
            <h5 className="text-xl">Number</h5>
            <div className="text-5xl text-white">{roundNumber?.toString()} of 3</div>
          </div>
          <div className="text-center w-[140px]">
            <h5 className="text-xl">State</h5>
            {roundState !== undefined && <div className="text-5xl text-white">{roundStateToName[roundState]}</div>}
          </div>
          <div>
            <h5 className="text-xl text-center w-[140px]">Clock</h5>
            <div className="flex justify-center">
              <span className="countdown font-mono text-5xl ">
                <span style={{ "--value": countdown } as React.CSSProperties}></span>
              </span>
            </div>
          </div>
        </div> */}
      </div>
      <div className="overflow-x-auto">
        <table className="table text-xl">
          <thead>
            <tr className="text-xl">
              <th>Round</th>
              <th>Low Risk</th>
              <th>Medium Risk</th>
              <th>High Risk</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>1</th>
              <td>3%</td>
              <td>-14%</td>
              <td>55%</td>
            </tr>
            <tr>
              <th>2</th>
              <td>3%</td>
              <td>-14%</td>
              <td>55%</td>
            </tr>
            <tr>
              <th>3</th>
              <td>?</td>
              <td>?</td>
              <td>?</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};
