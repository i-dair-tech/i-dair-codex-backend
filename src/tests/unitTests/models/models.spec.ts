import { ResponseType } from "../../../interfaces/response";
import { ModelStructure } from "../../../interfaces/model";
import { DatasetStructure } from "../../../interfaces/dataset";
import { Request, Response } from "express";
import { sequelize } from "../../../config/sequelize";
import { getListModelsByType } from "../../../controllers/models.controller";
import { createCompletedDataset, deleteDataset } from "../../helpers/dataset";
import { createModel, deleteModel } from "../../helpers/model";
import * as multer from "../../../middleware/multer";
import path from "path";
import { MSG } from "../../../common/responseMessages";
import { traceFunction } from "../../../common/functions";

describe("Get list of models", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: ResponseType;
  let mockDataset: DatasetStructure | null;
  let mockModel: ModelStructure | null;

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
    if (mockModel) {
      await deleteModel(mockModel.id);
      mockModel = null;
    }
  });

  test("should 400 missing data - get list of models", async () => {
    mockRequest = {
      query: {},
      body: {
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
      message: MSG.MISSING_DATA,
    };
    await traceFunction(
      "Get list models by type",
      getListModelsByType,
      mockRequest as Request,
      mockResponse as Response
    );
    expect(mockResponse.status).toHaveBeenCalledWith(expectedStatusCode);
    expect(JSON.stringify(responseObject)).toBe(
      JSON.stringify(expectedResponse)
    );
  });

  test("should 400 Target not found - get list of models", async () => {
    mockDataset = await createCompletedDataset(
      "hdp_data-1671177803889.csv",
      "/dataset/hdp_data-1671177803889.csv",
      "Kenya",
      "cancer"
    );
    mockRequest = {
      query: {
        idDataset: mockDataset.id_dataset.toString(),
        target: "testTarget",
      },
      body: {
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
      message: MSG.TARGET_NOT_FOUND,
    };
    const exportSpy = jest.spyOn(multer, "getPathToSave");
    exportSpy.mockImplementation(() => {
      return path.resolve(__dirname, "../../data");
    });
    await traceFunction(
      "Get list models by type",
      getListModelsByType,
      mockRequest as Request,
      mockResponse as Response
    );
    expect(mockResponse.status).toHaveBeenCalledWith(expectedStatusCode);
    expect(JSON.stringify(responseObject)).toBe(
      JSON.stringify(expectedResponse)
    );
  });

  test("should 200 list of classification models - get list of models", async () => {
    mockDataset = await createCompletedDataset(
      "hdp_data-1671177803889.csv",
      "/dataset/hdp_data-1671177803889.csv",
      "Kenya",
      "cancer"
    );
    mockModel = await createModel(
      "logistic regression",
      "classification",
      '{"C": [1], "tol": [0.0001], "n_iter": 10, "solver": ["lbfgs"], "penalty": ["l2"], "optimizer": ["BayesianOptimization"], "multi_class": ["auto"], "class_weight": [null], "random_state": [null], "fit_intercept": [true]}'
    );
    mockRequest = {
      query: {
        idDataset: mockDataset.id_dataset.toString(),
        target: "Married",
      },
      body: {
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
    const expectedStatusCode = 200;
    const exportSpy = jest.spyOn(multer, "getPathToSave");
    exportSpy.mockImplementation(() => {
      return path.resolve(__dirname, "../../data");
    });
    await traceFunction(
      "Get list models by type",
      getListModelsByType,
      mockRequest as Request,
      mockResponse as Response
    );
    expect(mockResponse.status).toHaveBeenCalledWith(expectedStatusCode);
    expect(Array.isArray(responseObject.data)).toBe(true);
  });

  test("should 200 list of regression models - get list of models", async () => {
    mockDataset = await createCompletedDataset(
      "hdp_data-1671177803889.csv",
      "/dataset/hdp_data-1671177803889.csv",
      "Kenya",
      "cancer"
    );
    mockModel = await createModel(
      "Linear regression",
      "regression",
      '{"copy_X": [true], "n_iter": 10, "positive": [false], "optimizer": ["BayesianOptimization"], "fit_intercept": [true]}'
    );
    mockRequest = {
      query: {
        idDataset: mockDataset.id_dataset.toString(),
        target: "Age",
      },
      body: {
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
    const expectedStatusCode = 200;
    const exportSpy = jest.spyOn(multer, "getPathToSave");
    exportSpy.mockImplementation(() => {
      return path.resolve(__dirname, "../../data");
    });
    await traceFunction(
      "Get list models by type",
      getListModelsByType,
      mockRequest as Request,
      mockResponse as Response
    );
    expect(mockResponse.status).toHaveBeenCalledWith(expectedStatusCode);
    expect(Array.isArray(responseObject.data)).toBe(true);
  });

  test("should 200 list of clustering models - get list of models", async () => {
    mockDataset = await createCompletedDataset(
      "hdp_data-1671177803889.csv",
      "/dataset/hdp_data-1671177803889.csv",
      "Kenya",
      "cancer"
    );
    mockModel = await createModel(
      "K-means",
      "clustering",
      '{"init": ["k-means++"], "n_init": [10], "n_iter": 10, "optimizer": ["BayesianOptimization"], "n_clusters": [8]}'
    );
    mockRequest = {
      query: {
        idDataset: mockDataset.id_dataset.toString(),
      },
      body: {
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
    const expectedStatusCode = 200;
    const exportSpy = jest.spyOn(multer, "getPathToSave");
    exportSpy.mockImplementation(() => {
      return path.resolve(__dirname, "../../data");
    });
    await traceFunction(
      "Get list models by type",
      getListModelsByType,
      mockRequest as Request,
      mockResponse as Response
    );
    expect(mockResponse.status).toHaveBeenCalledWith(expectedStatusCode);
    expect(Array.isArray(responseObject.data)).toBe(true);
  });
});
