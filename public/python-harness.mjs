export const PYTHON_HARNESS = `
import builtins as _builtins
import contextlib as _contextlib
import io as _io
import json as _json
import traceback as _traceback

def _codiva_run(payload):
    class Console(_io.StringIO):
        def write(self, text):
            if self.tell() + len(text) > 40000 or self.getvalue().count("\\n") + text.count("\\n") > 100:
                raise RuntimeError("Muitas mensagens no console. Reduza as repetições.")
            return super().write(text)

    def no_input(*args, **kwargs):
        raise RuntimeError("input() não está disponível neste exercício. Use os dados definidos no código.")

    def no_import(*args, **kwargs):
        raise ImportError("Este editor usa os recursos básicos de Python, sem importação de pacotes.")

    def same(actual, expected):
        if type(actual) is not type(expected):
            return False
        if isinstance(actual, dict):
            return actual.keys() == expected.keys() and all(same(actual[key], expected[key]) for key in expected)
        if isinstance(actual, list):
            return len(actual) == len(expected) and all(same(a, b) for a, b in zip(actual, expected))
        return actual == expected

    def explain(error):
        names = {"SyntaxError": "Confira a sintaxe", "IndentationError": "Confira a indentação", "TabError": "Use espaços consistentes para indentar", "NameError": "Confira os nomes das variáveis", "TypeError": "Confira os tipos dos valores", "IndexError": "Esse índice não existe na lista", "KeyError": "Essa chave não existe no dicionário"}
        line = getattr(error, "lineno", None)
        for frame in _traceback.extract_tb(error.__traceback__):
            if frame.filename == "<seu_codigo>":
                line = frame.lineno
        location = f" (linha {line})" if line else ""
        return f"{names.get(type(error).__name__, 'Não foi possível executar')}{location}: {error}"

    safe_builtins = vars(_builtins).copy()
    safe_builtins["input"] = no_input
    safe_builtins["__import__"] = no_import
    namespace = {"__builtins__": safe_builtins, "__name__": "__main__"}
    console = Console()
    checks = payload["checks"]
    try:
        with _contextlib.redirect_stdout(console), _contextlib.redirect_stderr(console):
            exec(compile(payload["source"], "<seu_codigo>", "exec"), namespace)
        logs = console.getvalue().splitlines()
        results = []
        for check in checks:
            result = {"label": check["label"], "passed": False}
            if "output" in check:
                result["passed"] = logs == check["output"]
            else:
                try:
                    with _contextlib.redirect_stdout(Console()), _contextlib.redirect_stderr(Console()):
                        actual = eval(check["expression"], namespace)
                    result["passed"] = same(actual, check["expected"])
                except Exception as error:
                    result["error"] = explain(error)
            results.append(result)
        return _json.dumps({"logs": logs, "results": results, "error": None}, ensure_ascii=False)
    except Exception as error:
        return _json.dumps({"logs": console.getvalue().splitlines(), "results": [{"label": check["label"], "passed": False} for check in checks], "error": explain(error)}, ensure_ascii=False)

_codiva_run(_json.loads(_codiva_payload))
`;
