import { ResponseType } from "../../../interfaces/response";
import { DatasetStructure } from "../../../interfaces/dataset";
import { Request, Response } from "express";
import { sequelize } from "../../../config/sequelize";
import { downloadFile } from "../../../controllers/dataset.controller";
import { createCompletedDataset, deleteDataset } from "../../helpers/dataset";
import * as multer from "../../../middleware/multer";
import path from "path";
import { traceFunction } from "../../../common/functions";

describe("Download dataset", () => {
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

  test("should 400 missing data - get list of models", async () => {
    mockRequest = {
      body: {},
      headers: {
        "trace-id": "",
        "span-id": "",
      },
    };
    const expectedStatusCode = 400;
    const expectedResponse = {
      success: false,
      message: "Missing Data",
    };
    await traceFunction(
      "Download file",
      downloadFile,
      mockRequest as Request,
      mockResponse as Response
    );
    expect(mockResponse.status).toHaveBeenCalledWith(expectedStatusCode);
    expect(JSON.stringify(responseObject)).toBe(
      JSON.stringify(expectedResponse)
    );
  });

  test("should 400 Data not found - get list of models", async () => {
    mockRequest = {
      body: {
        idDataset: "0",
        user: {
          email: "user@local.com",
          groupName: "local",
        },
      },
      headers: {
        "trace-id": "",
        "span-id": "",
      },
    };
    const expectedStatusCode = 400;
    const expectedResponse = {
      success: false,
      message: "Data not found",
    };
    await traceFunction(
      "Download file",
      downloadFile,
      mockRequest as Request,
      mockResponse as Response
    );
    expect(mockResponse.status).toHaveBeenCalledWith(expectedStatusCode);
    expect(JSON.stringify(responseObject)).toBe(
      JSON.stringify(expectedResponse)
    );
  });

  test("should 400 File not found - get list of models", async () => {
    mockDataset = await createCompletedDataset(
      "hdp_data-1671177803889.csv",
      "/dataset/hdp_data-1671177803889.csv",
      "Kenya",
      "cancer"
    );
    mockRequest = {
      body: {
        idDataset: mockDataset.id_dataset.toString(),
        user: {
          email: "user@local.com",
          groupName: "local",
        },
      },
      headers: {
        "trace-id": "",
        "span-id": "",
      },
    };
    const expectedStatusCode = 400;
    const expectedResponse = {
      success: false,
      message: "File not found",
    };
    const exportSpy = jest.spyOn(multer, "getPathToSave");
    exportSpy.mockImplementation(() => {
      return path.resolve(__dirname, "testFileNotFound");
    });
    await traceFunction(
      "Download file",
      downloadFile,
      mockRequest as Request,
      mockResponse as Response
    );
    expect(mockResponse.status).toHaveBeenCalledWith(expectedStatusCode);
    expect(JSON.stringify(responseObject)).toBe(
      JSON.stringify(expectedResponse)
    );
  });
});
