import { ResponseType } from "./../../../interfaces/response";
import { DatasetStructure } from "./../../../interfaces/dataset";
import { Request, Response } from "express";
import { sequelize } from "../../../config/sequelize";
import { getAllDataset } from "../../../controllers/dataset.controller";
import { createCompletedDataset, deleteDataset } from "../../helpers/dataset";
import { traceFunction } from "../../../common/functions";

describe("Get list of datasets", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: ResponseType;
  let mockDataset: DatasetStructure | null;

  beforeEach(async () => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockImplementation((result) => {
        responseObject = result;
      }),
    };
    await sequelize.sync();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (mockDataset) {
      await deleteDataset(mockDataset.id_dataset);
      mockDataset = null;
    }
  });

  test("should 200 list of datasets - get list of datasets", async () => {
    mockDataset = await createCompletedDataset(
      "hdp_data-1671177803889.csv",
      "/dataset/hdp_data-1671177803889.csv",
      "Kenya",
      "cancer"
    );
    mockRequest = {
      body: {
        user: {
          email: "user@local.com",
          groupName: "local",
        },
      },
      query: {
        idGroup: "0",
      },
      headers: {
        "trace-id": "",
        "span-id": "",
      },
    };
    const expectedStatusCode = 200;
    await traceFunction(
      "Get all dataset",
      getAllDataset,
      mockRequest as Request,
      mockResponse as Response
    );
    expect(mockResponse.status).toHaveBeenCalledWith(expectedStatusCode);
    expect(Array.isArray(responseObject.data)).toBe(true);
    expect(responseObject.data[0].file_name).toBe("hdp_data-1671177803889.csv");
  });
});
