import { useState } from "react";
import Image from "next/image";
import type { NextPage } from "next";
import { MetaHeader } from "~~/components/MetaHeader";
import { Leaderboard, Modal, Portfolio, Round, Vaults } from "~~/components/vaults-of-fortune/";
import { useScaffoldEventSubscriber } from "~~/hooks/scaffold-eth";

/** Homepage renders all of the child components and manages round start/end modals
 *
 * when round starts, modal pops up to let users know
 * when round ends, modal pops up showing the ROI results generated by VRF
 */

const CurrentContest: NextPage = () => {
  const [showRoundStartModal, setShowRoundStartModal] = useState(false);
  const [showRoundCalculating, setShowRoundCalculating] = useState(false);
  const [isRoundEnd, setIsRoundEnd] = useState(false);
  const [roundNumber, setRoundNumber] = useState(0);
  const [roundResults, setRoundResults] = useState({
    contestNumber: 0,
    roundNumber: 0,
    lowRiskVaultROI: 0,
    mediumRiskVaultROI: 0,
    highRiskVaultROI: 0,
  });

  useScaffoldEventSubscriber({
    contractName: "Market",
    eventName: "RoundStart",
    listener: logs => {
      logs.map(log => {
        const { roundNumber } = log.args;
        setRoundNumber(Number(roundNumber));
        setShowRoundStartModal(true);
      });
    },
  });

  useScaffoldEventSubscriber({
    contractName: "Market",
    eventName: "RoundCalculating",
    listener: logs => {
      logs.map(log => {
        const { roundNumber } = log.args;
        setRoundNumber(Number(roundNumber));
        setShowRoundCalculating(true);
      });
    },
  });

  useScaffoldEventSubscriber({
    contractName: "Market",
    eventName: "RoundROIResults",
    listener: logs => {
      logs.map(log => {
        const { contestNumber, roundNumber, lowRiskVaultROI, mediumRiskVaultROI, highRiskVaultROI } = log.args;
        console.log("RoundROIResults EVENT SUBSCRIBER", log.args);
        setRoundResults(() => {
          return {
            contestNumber: Number(contestNumber),
            roundNumber: Number(roundNumber),
            lowRiskVaultROI: Number(lowRiskVaultROI),
            mediumRiskVaultROI: Number(mediumRiskVaultROI),
            highRiskVaultROI: Number(highRiskVaultROI),
          };
        });
      });
      setIsRoundEnd(true);
    },
  });

  return (
    <>
      <MetaHeader />

      <div className="bg-base-300 min-h-[468px]">
        <div className="rounded-xl grid grid-cols-1 2xl:grid-cols-3 gap-14 p-5 lg:p-14">
          <div>
            <Leaderboard />
          </div>
          <div>
            <Portfolio />
          </div>
          <div>
            <Round showRoundCalculating={showRoundCalculating} roundNumber={roundNumber} />
          </div>
        </div>
      </div>
      <div className="p-5 xl:px-14 py-5 grow py-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-14">
          <Vaults />
        </div>
      </div>

      {showRoundStartModal && (
        <Modal isOpen={showRoundStartModal} onClose={() => setShowRoundStartModal(false)}>
          <div>
            <h3 className="font-cubano text-4xl text-center mb-5">Round {roundNumber} Started</h3>
            <div className="flex justify-center">
              <Image src="/roundstart.png" width="350" height="350" alt="vaults of fortune banner" />
            </div>
            <p className="text-center text-3xl">Allocate your funds before the time runs out!</p>
          </div>
        </Modal>
      )}

      {showRoundCalculating && (
        <Modal isOpen={showRoundCalculating} onClose={() => setShowRoundCalculating(false)}>
          <div className="h-[550px] flex flex-col justify-center">
            <h3 className="font-cubano text-4xl text-center mb-10">Round Closing Soon</h3>
            <div className="flex justify-center mb-5">
              <Image
                src="/round-closing.png"
                width="700"
                height="700"
                alt="vaults of fortune banner"
                className="rounded-xl"
              />
            </div>

            <p className="text-center text-2xl text-center">
              Deposit your GODL before chainlink VRF responds with random numbers!
            </p>
          </div>
        </Modal>
      )}

      {isRoundEnd && (
        <Modal isOpen={isRoundEnd} onClose={() => setIsRoundEnd(false)}>
          <div>
            <h3 className="font-cubano text-4xl text-center text-primary-content mb-5">
              End of Round {roundResults.roundNumber}
            </h3>

            <div className="h-[350px] flex flex-col justify-center">
              <div className="flex justify-center">
                <div className="overflow-x-auto text-base-content w-3/4">
                  <table className="table text-xl bg-base-300">
                    <thead>
                      <tr className="text-xl border-b border-white">
                        <th>Vault</th>
                        <th>ROI</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[#FFFFFF33]">
                        <th>Low Risk</th>
                        <td
                          className={`font-bold ${
                            roundResults.lowRiskVaultROI > 0 ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {roundResults.lowRiskVaultROI}%
                        </td>
                      </tr>
                      <tr className="border-b border-[#FFFFFF33]">
                        <th>Medium Risk</th>
                        <td
                          className={`font-bold ${
                            roundResults.mediumRiskVaultROI > 0 ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {roundResults.mediumRiskVaultROI}%
                        </td>
                      </tr>
                      <tr>
                        <th>High Risk</th>
                        <td
                          className={`font-bold ${
                            roundResults.highRiskVaultROI > 0 ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {roundResults.highRiskVaultROI}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default CurrentContest;
