import * as yup from "yup";

export const loginSchema = yup.object({
  email: yup
    .string()
    .email("Informe um e-mail válido")
    .required("E-mail é obrigatório"),
  password: yup
    .string()
    .min(6, "Mínimo de 6 caracteres")
    .required("Senha é obrigatória"),
});

export const registerSchema = yup.object({
  fullName: yup
    .string()
    .trim()
    .min(2, "Nome muito curto")
    .required("Nome é obrigatório"),
  email: yup
    .string()
    .email("Informe um e-mail válido")
    .required("E-mail é obrigatório"),
  phone: yup
    .string()
    .trim()
    .required("Telefone é obrigatório")
    .test("phone", "Informe um telefone válido com DDD (10 ou 11 dígitos)", (value) => {
      const digits = (value ?? "").replace(/\D/g, "");
      return digits.length === 10 || digits.length === 11;
    }),
  password: yup
    .string()
    .min(6, "Mínimo de 6 caracteres")
    .required("Senha é obrigatória"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "As senhas não coincidem")
    .required("Confirme a senha"),
});

export type LoginValues = yup.InferType<typeof loginSchema>;
export type RegisterValues = yup.InferType<typeof registerSchema>;
