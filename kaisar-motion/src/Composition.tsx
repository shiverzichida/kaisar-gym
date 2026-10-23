import React from 'react';
import { Composition, Series } from 'remotion';
import { IntroScene } from './scenes/IntroScene';
import { ProblemSolutionScene } from './scenes/ProblemSolutionScene';
import { HardwareConceptScene } from './scenes/HardwareConceptScene';
import { PosIntegrationScene } from './scenes/PosIntegrationScene';
import { RoadmapScene } from './scenes/RoadmapScene';
import { ClosingScene } from './scenes/ClosingScene';

export const KaisarProposalVideo: React.FC = () => {
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: '#070D1E',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <Series>
        {/* Scene 1: Intro & Title (6 seconds) */}
        <Series.Sequence durationInFrames={180}>
          <IntroScene />
        </Series.Sequence>

        {/* Scene 2: Problem vs Solution (7 seconds) */}
        <Series.Sequence durationInFrames={210}>
          <ProblemSolutionScene />
        </Series.Sequence>

        {/* Scene 3: Hardware & 1-Channel Bidirectional (9 seconds) */}
        <Series.Sequence durationInFrames={270}>
          <HardwareConceptScene />
        </Series.Sequence>

        {/* Scene 4: POS & Business Rules Status (9 seconds) */}
        <Series.Sequence durationInFrames={270}>
          <PosIntegrationScene />
        </Series.Sequence>

        {/* Scene 5: 5-Day Implementation Roadmap (6 seconds) */}
        <Series.Sequence durationInFrames={180}>
          <RoadmapScene />
        </Series.Sequence>

        {/* Scene 6: Closing & Zag Digital Signature (6 seconds) */}
        <Series.Sequence durationInFrames={180}>
          <ClosingScene />
        </Series.Sequence>
      </Series>
    </div>
  );
};

export const MyComposition = () => {
  return (
    <Composition
      id="KaisarProposalExplainer"
      component={KaisarProposalVideo}
      durationInFrames={1290}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
