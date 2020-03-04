import os


def get_env(name):
    try:
        return os.environ[name]
    except KeyError:
        try:
            from config import DevConfig
            return getattr(DevConfig, name)
        except AttributeError:
            return None
