from flask import Flask, render_template, request, jsonify
import numpy as np

app = Flask(__name__, template_folder='.', static_folder='.', static_url_path='')

# Generate a random dataset
data_points = None

def generate_dataset():
    global data_points
    data_points = np.random.randn(200, 2).tolist()

generate_dataset()

# KMeans Algorithm Implementation
class KMeans:
    def __init__(self, n_clusters=3, init_method='random', max_iter=100):
        self.n_clusters = n_clusters
        self.init_method = init_method
        self.max_iter = max_iter
        self.centroids = []
        self.clusters = {}

    def initialize_centroids(self, data):
        if self.init_method == 'random':
            self.centroids = data[np.random.choice(len(data), self.n_clusters, replace=False)]
        elif self.init_method == 'farthest':
            self.centroids = self.farthest_first_initialization(data)
        elif self.init_method == 'kmeans++':
            self.centroids = self.kmeans_plus_plus_initialization(data)
        # Manual initialization will be handled on the frontend
        return self.centroids.tolist()

    def farthest_first_initialization(self, data):
        centroids = [data[np.random.randint(len(data))]]
        for _ in range(1, self.n_clusters):
            distances = np.array([min([np.linalg.norm(x - c) for c in centroids]) for x in data])
            next_centroid = data[np.argmax(distances)]
            centroids.append(next_centroid)
        return np.array(centroids)

    def kmeans_plus_plus_initialization(self, data):
        centroids = [data[np.random.randint(len(data))]]
        for _ in range(1, self.n_clusters):
            distances = np.array([min([np.linalg.norm(x - c) ** 2 for c in centroids]) for x in data])
            probabilities = distances / distances.sum()
            cumulative_probabilities = probabilities.cumsum()
            r = np.random.rand()
            for idx, cp in enumerate(cumulative_probabilities):
                if r < cp:
                    centroids.append(data[idx])
                    break
        return np.array(centroids)

    def assign_clusters(self, data):
        self.clusters = {}
        for idx in range(self.n_clusters):
            self.clusters[idx] = []
        for idx, x in enumerate(data):
            distances = [np.linalg.norm(x - c) for c in self.centroids]
            cluster_idx = np.argmin(distances)
            self.clusters[cluster_idx].append(idx)

    def update_centroids(self):
        for idx in range(self.n_clusters):
            if self.clusters[idx]:
                self.centroids[idx] = np.mean([data_points[i] for i in self.clusters[idx]], axis=0)
            else:
                # Handle empty cluster by reinitializing centroid
                self.centroids[idx] = data_points[np.random.randint(len(data_points))]

    def fit_step(self, data):
        self.assign_clusters(data)
        old_centroids = self.centroids.copy()
        self.update_centroids()
        return old_centroids.tolist(), self.centroids.tolist(), self.clusters

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate():
    generate_dataset()
    return jsonify({'status': 'Dataset generated', 'data': data_points})

@app.route('/initialize', methods=['POST'])
def initialize():
    data = np.array(data_points)
    init_method = request.json.get('method')
    num_clusters = int(request.json.get('num_clusters', 3))
    kmeans = KMeans(n_clusters=num_clusters, init_method=init_method)
    centroids = kmeans.initialize_centroids(data)
    return jsonify({'centroids': centroids})


@app.route('/step', methods=['POST'])
def step():
    data = np.array(data_points)
    centroids = np.array(request.json.get('centroids'))
    num_clusters = int(request.json.get('num_clusters', 3))


    print(f"Received centroids: {centroids}")

    kmeans = KMeans(n_clusters=num_clusters)
    kmeans.centroids = centroids
    old_centroids, new_centroids, clusters = kmeans.fit_step(data)

    print(f"Clusters assigned: {clusters}")

    return jsonify({
        'old_centroids': old_centroids,
        'new_centroids': new_centroids,
        'clusters': clusters
    })


if __name__ == '__main__':
    app.run(debug=True, port=3000)
