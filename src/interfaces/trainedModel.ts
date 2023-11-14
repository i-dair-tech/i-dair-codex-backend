export interface TrainedModelStructure {
  id: number;
  idDataset: number;
  idModel: number;
  runId: string;
  isBest: boolean | number;
  trainStatus: string | undefined;
  trainProgress: number;
  task: string | undefined;
  sessionId: number;
}
