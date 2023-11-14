import { sequelize } from "../../config/sequelize";

const createCompletedDataset = async (
  fileName: string,
  filePath: string,
  country: string,
  studyName: string
) => {
  const dataset = await sequelize.query(
    "INSERT INTO dataset (file_name,file_path,country,study_name,id_user) VALUES ($fileName,$filePath,$country,$studyName,$idUser) ",
    {
      bind: {
        fileName,
        filePath,
        country,
        studyName,
        idUser: 1,
      },
    }
  );
  return {
    id_dataset: dataset[0] as unknown as number,
    fileName,
    filePath,
    country,
    studyName,
    idUser: 1,
  };
};

const deleteDataset = (idDataset: number) => {
  return sequelize.query("DELETE FROM dataset WHERE id= :idDataset ", {
    replacements: {
      idDataset,
    },
  });
};

export { createCompletedDataset, deleteDataset };
