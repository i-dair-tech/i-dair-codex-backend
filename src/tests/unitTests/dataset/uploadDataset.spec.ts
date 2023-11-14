import fs from "fs";
import { ResponseType } from "../../../interfaces/response";
import { DatasetStructure } from "../../../interfaces/dataset";
import { Request, Response } from "express";
import { sequelize } from "../../../config/sequelize";
import { uploadDataset } from "../../../controllers/dataset.controller";
import { deleteDataset } from "../../helpers/dataset";
import { MSG } from "../../../common/responseMessages";
import * as multer from "../../../middleware/multer";
import path from "path";
import { traceFunction } from "../../../common/functions";

describe("Upload dataset", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: ResponseType;
  let mockDataset: DatasetStructure | null;

  beforeEach(async () => {
    jest.resetModules();
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
    if (responseObject.fileId) {
      await deleteDataset(responseObject.fileId);
    }
  });

  // missing country and studyName
  test("should 400 missing data - upload dataset", async () => {
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
      message: MSG.MISSING_DATA,
    };

    await traceFunction(
      "Upload",
      uploadDataset,
      mockRequest as Request,
      mockResponse as Response
    );
    expect(mockResponse.status).toHaveBeenCalledWith(expectedStatusCode);
    expect(JSON.stringify(responseObject)).toBe(
      JSON.stringify(expectedResponse)
    );
  });

  // missing country and studyName
  test("should 400 missing data - upload dataset", async () => {
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
      message: MSG.MISSING_DATA,
    };
    await traceFunction(
      "Upload",
      uploadDataset,
      mockRequest as Request,
      mockResponse as Response
    );
    expect(mockResponse.status).toHaveBeenCalledWith(expectedStatusCode);
    expect(JSON.stringify(responseObject)).toBe(
      JSON.stringify(expectedResponse)
    );
  });

  // missing studyName
  test("should 400 missing data - upload dataset", async () => {
    mockRequest = {
      body: {
        studyName: "dfgdfgf",
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
      "Upload",
      uploadDataset,
      mockRequest as Request,
      mockResponse as Response
    );
    expect(mockResponse.status).toHaveBeenCalledWith(expectedStatusCode);
    expect(JSON.stringify(responseObject)).toBe(
      JSON.stringify(expectedResponse)
    );
  });

  test("should handle user not found - upload dataset", async () => {});

  // missing idGroup
  test("should 400 missing data - upload dataset", async () => {
    mockRequest = {
      body: {
        idGroup: 1,
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
      "Upload",
      uploadDataset,
      mockRequest as Request,
      mockResponse as Response
    );
    expect(mockResponse.status).toHaveBeenCalledWith(expectedStatusCode);
    expect(JSON.stringify(responseObject)).toBe(
      JSON.stringify(expectedResponse)
    );
  });

  // missing file
  test("should 400 missing data - upload dataset", async () => {
    mockRequest = {
      body: {
        country: "Kenya",
        studyName: "cancer",
        user: {
          email: "user@local.com",
          groupName: "local",
        },
        idGroup: "0",
      },
      files: [],
      headers: {
        "trace-id": "",
        "span-id": "",
      },
    };

    const expectedStatusCode = 400;
    const expectedResponse = {
      success: false,
      message: MSG.MISSING_FILE,
    };
    await traceFunction(
      "Upload",
      uploadDataset,
      mockRequest as Request,
      mockResponse as Response
    );
    expect(mockResponse.status).toHaveBeenCalledWith(expectedStatusCode);
    expect(JSON.stringify(responseObject)).toBe(
      JSON.stringify(expectedResponse)
    );
  });

  // missing studyName
  test("should 400 missing data - upload dataset", async () => {
    const exportSpy = jest.spyOn(multer, "getPathToSave");
    exportSpy.mockImplementation(() => {
      return path.resolve(__dirname, "../../data");
    });
    mockRequest = {
      body: {
        country: "Kenya",
        studyName: "cancer",
        user: {
          email: "user@local.com",
          groupName: "local",
        },
        idGroup: "0",
      },
      file: {
        originalname: "invalid-file.csv",
        fieldname: "invalid-file",
        filename: "invalid-file.csv",
        mimetype: "sample.type",
        path: multer.getPathToSave() + "/invalid-file.csv",
        buffer: Buffer.from(multer.getPathToSave() + "/invalid-file.csv"),
        encoding: "",
        size: 50,
        stream: fs.createReadStream(
          multer.getPathToSave() + "/invalid-file.csv"
        ),
        destination: multer.getPathToSave() + "/invalid-file1.csv",
      },
      headers: {
        "trace-id": "",
        "span-id": "",
      },
    };

    const expectedStatusCode = 200;
    await traceFunction(
      "Upload",
      uploadDataset,
      mockRequest as Request,
      mockResponse as Response
    );
    expect(mockResponse.status).toHaveBeenCalledWith(expectedStatusCode);
    const expectedResponse = {
      success: true,
      message: MSG.FILE_UPLOADED_SUCCESSFULLY,
      fileId: responseObject.fileId,
    };
    expect(JSON.stringify(responseObject)).toBe(
      JSON.stringify(expectedResponse)
    );
  });
});
