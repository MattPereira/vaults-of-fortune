import React, { useEffect, useState } from "react";
import { useScaffoldContractRead, useScaffoldEventHistory, useScaffoldEventSubscriber } from "~~/hooks/scaffold-eth";

type IRoundStateToName = {
  [key: number]: string;
};

export const Round = () => {
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

  useEffect(() => {
    if (startCountdown) {
      // Set the initial value of the countdown
      setCountdown(Number(roundInterval));

      const interval = setInterval(() => {
        setCountdown(prevCountdown => (prevCountdown > 0 ? prevCountdown - 1 : 0));
      }, 1000); // Update every second

      return () => clearInterval(interval); // Clear the interval on component unmount
    }
  }, [roundInterval, startCountdown]);

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

  return (
    <>
      <div className="mb-5">
        <h3 className="text-center text-3xl font-cubano mb-5">Round</h3>
        <div className="stats shadow w-full">
          <div className="stat place-items-center">
            <div className="stat-title">Number</div>
            <div className="stat-value text-4xl">{roundNumber?.toString()} of 3</div>
          </div>

          <div className="stat place-items-center">
            <div className="stat-title">State</div>
            <div className="stat-value text-4xl">{roundState !== undefined && roundStateToName[roundState]}</div>
          </div>
          <div className="stat place-items-center">
            <div className="stat-title">Clock</div>
            <div className="stat-value">
              <div className="flex justify-center">
                <span className="countdown font-mono text-4xl ">
                  <span style={{ "--value": countdown } as React.CSSProperties}></span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <RoiTable />
    </>
  );
};

type RoundResultsData = {
  contestNumber: number;
  roundNumber: number;
  lowRiskVaultROI: number;
  mediumRiskVaultROI: number;
  highRiskVaultROI: number;
};

/**
 *
 * @notice use contestNumber to filter the results so you only get round roi for current contest
 * @notice don't forget to turn on!
 */

const RoiTable = () => {
  const [roundResults, setRoundResults] = useState<RoundResultsData[]>([]);

  // const { data: currentContest } = useScaffoldContractRead({
  //   contractName: "Market",
  //   functionName: "currentContest",
  // });

  const { data: events, isLoading: isLoadingEvents } = useScaffoldEventHistory({
    contractName: "Market",
    eventName: "RoundResults",
    // Specify the starting block number from which to read events, this is a bigint.
    fromBlock: 0n,
    blockData: true,
    // Apply filters to the event based on parameter names and values { [parameterName]: value },
    // filters: { contestNumber: currentContest },
    transactionData: true,
    receiptData: true,
  });

  useScaffoldEventSubscriber({
    contractName: "Market",
    eventName: "RoundResults",
    listener: logs => {
      logs.map(log => {
        const { contestNumber, roundNumber, lowRiskVaultROI, mediumRiskVaultROI, highRiskVaultROI } = log.args;
        setRoundResults(prevResults => {
          return [
            ...prevResults,
            {
              contestNumber: Number(contestNumber),
              roundNumber: Number(roundNumber),
              lowRiskVaultROI: Number(lowRiskVaultROI),
              mediumRiskVaultROI: Number(mediumRiskVaultROI),
              highRiskVaultROI: Number(highRiskVaultROI),
            },
          ];
        });
      });
    },
  });

  useEffect(() => {
    if (!roundResults?.length && !!events?.length && !isLoadingEvents) {
      setRoundResults(
        events.map(({ args }) => {
          return {
            contestNumber: Number(args.contestNumber),
            roundNumber: Number(args.roundNumber),
            lowRiskVaultROI: Number(args.lowRiskVaultROI),
            mediumRiskVaultROI: Number(args.mediumRiskVaultROI),
            highRiskVaultROI: Number(args.highRiskVaultROI),
          };
        }),
      );
    }
  }, [roundResults.length, events, isLoadingEvents]);

  const roiColor = (roi: number) => {
    if (roi > 0) {
      return "text-green-400";
    } else if (roi < 0) {
      return "text-red-400";
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="table text-xl">
        <thead>
          <tr className="text-xl">
            <th>Round</th>
            <th>Low</th>
            <th>Med</th>
            <th>High</th>
          </tr>
        </thead>
        <tbody>
          {roundResults.map(result => (
            <tr key={result.roundNumber}>
              <th>{result.roundNumber}</th>
              <td className={roiColor(result.lowRiskVaultROI)}>{result.lowRiskVaultROI}%</td>
              <td className={roiColor(result.mediumRiskVaultROI)}>{result.mediumRiskVaultROI}%</td>
              <td className={roiColor(result.highRiskVaultROI)}>{result.highRiskVaultROI}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
