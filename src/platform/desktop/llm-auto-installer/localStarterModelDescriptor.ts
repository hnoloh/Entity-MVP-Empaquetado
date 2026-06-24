export interface LocalStarterModelDescriptor {
  id: string;
  name: string;
  filename: string;
  expectedSize: number;
  url: string;
}

export const QWEN_2_5_0_5B_STARTER: LocalStarterModelDescriptor = {
  id: 'qwen2.5-0.5b',
  name: 'Qwen 2.5 0.5B',
  filename: 'qwen2.5-0.5b-instruct-q4_k_m.gguf',
  expectedSize: 491400032, // roughly ~398MB
  url: 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf'
};
