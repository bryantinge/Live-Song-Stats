import os


def get_env(name):
    try:
        return os.environ[name]
    except KeyError:
        import config
        return config.config[name]
