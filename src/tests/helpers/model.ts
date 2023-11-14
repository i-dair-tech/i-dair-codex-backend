import { sequelize } from "../../config/sequelize";

const createModel = async (
  name: string,
  type: string,
  hyperparameters: string
) => {
  const model = await sequelize.query(
    "INSERT INTO models (name,type,is_active,hyperparameters) VALUES ($name,$type,$isActive,$hyperparameters) ",
    {
      bind: {
        name,
        type,
        isActive: 1,
        hyperparameters,
      },
    }
  );
  return {
    id: model[0] as unknown as number,
    name,
    type,
    isActive: 1,
    hyperparameters,
  };
};

const deleteModel = (idModel: number) => {
  return sequelize.query("DELETE FROM models WHERE id= :idModel ", {
    replacements: {
      idModel,
    },
  });
};

export { createModel, deleteModel };
